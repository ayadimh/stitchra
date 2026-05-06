from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2


app = FastAPI(title="Stitchra Machine-Aware Embroidery API")

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


# -----------------------------
# Machine assumptions for V1
# -----------------------------
# This is based on a single-head commercial embroidery machine workflow.
# The values are deliberately conservative for business planning.
MACHINE_SPEED_SPM = 900  # realistic average stitches per minute, not max advertised speed
THREAD_CHANGE_SECONDS = 20
SETUP_MINUTES = 4
PACKAGING_EUR = 1.00
HANDLING_EUR = 1.00
MACHINE_WEAR_EUR = 5.00
SHIRT_COST_EUR = 1.50
TARGET_SMALL_PRICE_EUR = 11.99
TARGET_LARGE_PRICE_EUR = 14.99
STITCH_COST_PER_1000_EUR = 0.05
MARGIN_EUR = 3.50


PRODUCT_PRESETS = {
    "tshirt": {
        "label": "T-Shirt",
        "blank_cost": 1.50,
        "max_width_mm": 280,
        "max_height_mm": 350,
    },
    "hoodie": {
        "label": "Hoodie",
        "blank_cost": 8.00,
        "max_width_mm": 280,
        "max_height_mm": 350,
    },
    "cap": {
        "label": "Cap",
        "blank_cost": 3.50,
        "max_width_mm": 120,
        "max_height_mm": 55,
    },
    "patch": {
        "label": "Patch",
        "blank_cost": 0.80,
        "max_width_mm": 120,
        "max_height_mm": 120,
    },
}


def kmeans_quantize(image_bgr: np.ndarray, k: int) -> np.ndarray:
    """Color-reduce an image with OpenCV k-means (k clusters)."""
    Z = image_bgr.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, _ = cv2.kmeans(Z, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    return labels.reshape(image_bgr.shape[:2])


def estimate_complexity(stitches: int, colors: int, coverage: float) -> tuple[str, list[str]]:
    """Return embroidery complexity and warnings based on machine-aware rules."""
    warnings: list[str] = []

    if stitches < 8000 and colors <= 3 and coverage <= 0.35:
        complexity = "Easy"
    elif stitches < 25000 and colors <= 6 and coverage <= 0.55:
        complexity = "Medium"
    elif stitches < 60000 and colors <= 6 and coverage <= 0.75:
        complexity = "Advanced"
    else:
        complexity = "Heavy"

    if stitches > 60000:
        warnings.append("High stitch count. Production time and risk of thread breaks increase.")
    if coverage > 0.75:
        warnings.append("High coverage. Design may feel heavy on fabric.")
    if colors > 6:
        warnings.append("Too many colors for the current V1 workflow. Simplify the design.")
    if stitches < 1000:
        warnings.append("Very low stitch count. The design may be too small or too empty.")

    return complexity, warnings


def calculate_machine_time_minutes(stitches: int, colors: int) -> float:
    """Estimate real production time, including setup and thread changes."""
    stitch_minutes = stitches / MACHINE_SPEED_SPM if MACHINE_SPEED_SPM else 0
    color_change_minutes = max(0, colors - 1) * THREAD_CHANGE_SECONDS / 60
    total = stitch_minutes + color_change_minutes + SETUP_MINUTES
    return round(total, 1)


def calculate_price(
    stitches: int,
    width_mm: float,
    product_type: str = "tshirt",
) -> tuple[float, dict]:
    """Business-first price model for Stitchra V1."""
    product = PRODUCT_PRESETS.get(product_type, PRODUCT_PRESETS["tshirt"])
    blank_cost = float(product["blank_cost"])
    stitch_cost = (stitches / 1000.0) * STITCH_COST_PER_1000_EUR

    raw_price = (
        blank_cost
        + MACHINE_WEAR_EUR
        + HANDLING_EUR
        + PACKAGING_EUR
        + stitch_cost
        + MARGIN_EUR
    )

    # Keep T-shirt V1 pricing inside the business target.
    # Other products can later receive their own pricing tiers.
    if product_type == "tshirt":
        if width_mm <= 100:
            price = min(raw_price, TARGET_SMALL_PRICE_EUR)
        else:
            price = min(raw_price, TARGET_LARGE_PRICE_EUR)
    else:
        price = raw_price

    price = round(price, 2)

    breakdown = {
        "blank_cost_eur": round(blank_cost, 2),
        "machine_wear_eur": MACHINE_WEAR_EUR,
        "handling_eur": HANDLING_EUR,
        "packaging_eur": PACKAGING_EUR,
        "stitch_cost_eur": round(stitch_cost, 2),
        "margin_eur": MARGIN_EUR,
        "raw_price_eur": round(raw_price, 2),
        "final_price_eur": price,
        "shipping_note": "Shipping is not included and should be added separately.",
    }

    return price, breakdown


@app.post("/estimate")
async def estimate(
    file: UploadFile = File(...),
    width_mm: float = Form(80.0),
    height_mm: float = Form(60.0),
    colors: int = Form(2),
    product_type: str = Form("tshirt"),
):
    """Estimate stitches, machine time, complexity and price from an uploaded image + size."""
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

    machine_time_minutes = calculate_machine_time_minutes(stitches, k)
    complexity, warnings = estimate_complexity(stitches, k, coverage)
    price, price_breakdown = calculate_price(stitches, width_mm, product_type)

    product = PRODUCT_PRESETS.get(product_type, PRODUCT_PRESETS["tshirt"])
    compatible_area = width_mm <= product["max_width_mm"] and height_mm <= product["max_height_mm"]

    if not compatible_area:
        warnings.append(
            f"Design area is too large for {product['label']} preset. Reduce size or choose another product."
        )

    machine_status = "Machine-ready estimate" if compatible_area and complexity != "Heavy" else "Needs review"

    return {
        # Existing fields used by the frontend
        "stitches": stitches,
        "colors": k,
        "coverage": coverage,
        "price_eur": price,
        "width_mm": width_mm,
        "height_mm": height_mm,
        # New machine-aware fields
        "product_type": product_type,
        "product_label": product["label"],
        "machine_type": "single-head commercial embroidery machine",
        "machine_speed_spm": MACHINE_SPEED_SPM,
        "machine_time_minutes": machine_time_minutes,
        "complexity": complexity,
        "machine_status": machine_status,
        "compatible_area": compatible_area,
        "warnings": warnings,
        "price_breakdown": price_breakdown,
    }


def make_logo(prompt: str, fg=(0, 200, 83, 255), stroke=(0, 0, 0, 255)) -> Image.Image:
    """Create a simple black-green placeholder logo PNG from text."""
    W, H = 512, 256
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    text = (prompt or "STITCHRA").strip()[:20]

    try:
        font = ImageFont.truetype("Arial.ttf", 88)
    except Exception:
        font = ImageFont.load_default()

    try:
        bbox = d.textbbox((0, 0), text, font=font, stroke_width=2)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        tw, th = d.textsize(text, font=font)

    x = (W - tw) // 2
    y = (H - th) // 2

    d.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 180))
    d.text((x, y), text, font=font, fill=fg, stroke_width=2, stroke_fill=stroke)
    d.rectangle([20, H - 24, W - 20, H - 12], fill=fg)
    return img


@app.post("/generate_logo")
async def generate_logo(prompt: str = Form("Machine-aware embroidery design")):
    """Return a temporary generated PNG logo placeholder.

    Later this endpoint can be replaced by the local AI server.
    """
    img = make_logo(prompt)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.get("/")
def health():
    """Simple liveness endpoint."""
    return {
        "status": "ok",
        "service": "stitchra-machine-aware-embroidery-api",
        "machine_type": "single-head commercial embroidery machine",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
