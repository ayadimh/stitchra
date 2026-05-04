from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2


app = FastAPI(title="Embroidery Estimator")

# Allow the deployed frontend and local dev server to call this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stitchra.com",
        "https://www.stitchra.com",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def kmeans_quantize(image_bgr: np.ndarray, k: int) -> np.ndarray:
    """Color-reduce an image with OpenCV k-means (k clusters)."""
    Z = image_bgr.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, _ = cv2.kmeans(Z, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    return labels.reshape(image_bgr.shape[:2])


@app.post("/estimate")
async def estimate(
    file: UploadFile = File(...),
    width_mm: float = Form(80.0),
    height_mm: float = Form(60.0),
    colors: int = Form(2),
):
    """Estimate stitches/price from an uploaded image + size."""
    data = await file.read()
    img = Image.open(BytesIO(data)).convert("RGB")
    img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    k = max(1, min(6, int(colors)))
    labelmap = kmeans_quantize(img_bgr, k)

    counts = np.bincount(labelmap.ravel())
    bg = int(np.argmax(counts))
    coverage = float(1.0 - counts[bg] / counts.sum())

    area_in2 = (width_mm * height_mm) / 645.16  # 1 in² = 645.16 mm²
    STITCHES_PER_IN2 = 1800
    stitches = int(area_in2 * coverage * STITCHES_PER_IN2)

    BASE_EUR, RATE_PER_1K, COLOR_FEE = 3.50, 1.00, 0.75
    price = BASE_EUR + (stitches / 1000.0) * RATE_PER_1K + (k - 1) * COLOR_FEE
    price = max(10.0, round(price, 2))

    return {
        "stitches": stitches,
        "colors": k,
        "coverage": coverage,
        "price_eur": price,
        "width_mm": width_mm,
        "height_mm": height_mm,
    }


def make_logo(prompt: str, fg=(0, 200, 83, 255), stroke=(0, 0, 0, 255)) -> Image.Image:
    """Create a simple black‑green logo PNG from text."""
    W, H = 512, 256
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    text = (prompt or "LOGO").strip()[:20]

    # Try a TrueType font; fall back to the default bitmap font
    try:
        font = ImageFont.truetype("Arial.ttf", 96)
    except Exception:
        font = ImageFont.load_default()

    # Measure text (textbbox is preferred; textsize as fallback)
    try:
        bbox = d.textbbox((0, 0), text, font=font, stroke_width=2)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        tw, th = d.textsize(text, font=font)

    x = (W - tw) // 2
    y = (H - th) // 2

    # Shadow
    d.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 180))
    # Main text in green with black stroke
    d.text((x, y), text, font=font, fill=fg, stroke_width=2, stroke_fill=stroke)
    # Accent stripe
    d.rectangle([20, H - 24, W - 20, H - 12], fill=fg)
    return img


@app.post("/generate_logo")
async def generate_logo(prompt: str = Form("Black‑Green")):
    """Return a generated PNG logo (black‑green theme)."""
    img = make_logo(prompt)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.get("/")
def health():
    """Simple liveness endpoint."""
    return {"status": "ok", "service": "embroidery-estimator"}


if __name__ == "__main__":
    # Allow `python main.py` to start the server directly.
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
