import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2


app = FastAPI(title="Stitchra Embroidery API")

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
PRACTICAL_THREAD_COLOR_LIMIT = 15
CHEAP_PRODUCT_COLOR_LIMIT = 6
MANUAL_REVIEW_COLOR_LIMIT = 10
MANUAL_QUOTE_STITCH_LIMIT = 90000

BLANK_TSHIRT_EUR = 2.50
BACKING_LEFT_EUR = 0.15
BACKING_CENTER_EUR = 0.35
THREAD_AND_BOBBIN_PER_1000_STITCHES_EUR = 0.035
NEEDLE_WEAR_EUR = 0.05
ELECTRICITY_EUR = 0.03
PACKAGING_EUR = 0.30
WASTE_BUFFER_EUR = 0.50
MACHINE_PAYBACK_EUR = 0.75
COLOR_COMPLEXITY_FEE_EUR = 0.60


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


PLACEMENT_LIMITS = {
    "left": {
        "label": "left chest",
        "max_colors": 6,
        "style": "simple badge logo",
    },
    "center": {
        "label": "center front",
        "max_colors": 10,
        "style": "bold front graphic",
    },
}


def prepare_embroidery_design(
    customer_prompt: str,
    placement: str = "left",
    width_mm: float = 90.0,
    height_mm: float = 60.0,
    shirt_color: str = "black",
    max_colors: int = PRACTICAL_THREAD_COLOR_LIMIT,
) -> dict:
    """Compile a creative idea into embroidery-safe design guidance."""
    clean_prompt = " ".join((customer_prompt or "").strip().split())
    if not clean_prompt:
        clean_prompt = "simple custom brand mark"

    normalized_placement = "center" if placement == "center" else "left"
    placement_rule = PLACEMENT_LIMITS[normalized_placement]
    safe_max_colors = max(1, min(PRACTICAL_THREAD_COLOR_LIMIT, int(max_colors or 1)))
    if normalized_placement == "left" or width_mm <= 100 or height_mm <= 70:
        effective_max_colors = min(safe_max_colors, placement_rule["max_colors"])
        recommended_style = "clean embroidered badge with bold silhouette"
    else:
        effective_max_colors = min(safe_max_colors, placement_rule["max_colors"])
        recommended_style = "bold embroidery-ready front graphic"

    prompt_lower = clean_prompt.lower()
    warnings: list[str] = []
    recommendations: list[str] = []
    score = 92

    risky_detail_words = [
        "photorealistic",
        "realistic",
        "portrait",
        "gradient",
        "shadow",
        "small text",
        "tiny text",
        "thin line",
        "thin lines",
        "many details",
        "detailed",
        "galaxy",
        "stars",
        "space",
        "smoke",
        "watercolor",
        "3d",
    ]
    found_risks = [word for word in risky_detail_words if word in prompt_lower]

    if normalized_placement == "left":
        warnings.append(
            "Small chest placement needs a simple badge shape and readable details."
        )
        recommendations.append("Use one main subject, bold outlines and no tiny text.")
        score -= 6

    if found_risks:
        warnings.append(
            "The idea includes details that may need simplification for embroidery."
        )
        recommendations.append(
            "Remove gradients, tiny marks and fine lines. Keep the strongest silhouette."
        )
        score -= min(24, 4 * len(found_risks))

    if len(clean_prompt.split()) > 14:
        warnings.append("Long ideas are best reduced to one clear symbol or badge.")
        recommendations.append("Focus on the main character, object or action.")
        score -= 8

    if "text" in prompt_lower or "word" in prompt_lower or "letter" in prompt_lower:
        warnings.append("Small text may not stay readable after stitching.")
        recommendations.append("Use large lettering only, or remove text from the logo.")
        score -= 10

    contrast_note = (
        "Use bright thread colors for strong contrast on a dark shirt."
        if shirt_color == "black"
        else "Use darker thread colors for strong contrast on a light shirt."
    )
    recommendations.append(contrast_note)
    recommendations.append(
        f"Limit this placement to about {effective_max_colors} clear thread colors."
    )

    prompt_parts = [
        clean_prompt,
        f"converted into a {recommended_style}",
        f"for {placement_rule['label']} embroidery at {int(width_mm)}x{int(height_mm)} mm",
        f"maximum {effective_max_colors} flat thread colors",
        "bold readable silhouette",
        "thick shapes",
        "clean high-contrast outlines",
        "centered composition",
        "transparent background",
        "no gradients",
        "no photorealism",
        "no tiny text",
        "no thin lines",
        "no small scattered details",
    ]

    simplified_description = (
        f"{clean_prompt} simplified into a bold {placement_rule['label']} "
        f"embroidery mark with thick shapes and a clear color palette."
    )

    return {
        "embroidery_prompt": ", ".join(prompt_parts),
        "recommended_style": recommended_style,
        "max_colors": effective_max_colors,
        "warnings": warnings,
        "recommendations": recommendations,
        "machine_ready_score": max(0, min(100, int(score))),
        "simplified_description": simplified_description,
    }


def rgb_to_hex(rgb: np.ndarray | list[int] | tuple[int, int, int]) -> str:
    """Return a #rrggbb string from RGB values."""
    red, green, blue = [int(value) for value in rgb[:3]]
    return f"#{red:02x}{green:02x}{blue:02x}"


def image_to_png_data_url(image: Image.Image) -> str:
    """Encode a PIL image as a PNG data URL."""
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def resize_for_analysis(image: Image.Image, max_dimension: int = 1400) -> Image.Image:
    """Keep analysis fast while preserving enough detail for preview cleanup."""
    image = image.convert("RGBA")
    if max(image.size) <= max_dimension:
        return image

    resized = image.copy()
    resized.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    return resized


def detect_background(image: Image.Image) -> dict:
    """Detect whether an image has transparent, white, black, solid, or complex background."""
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3].astype(np.int16)
    alpha = rgba[:, :, 3]
    height, width = alpha.shape

    transparent_ratio = float(np.mean(alpha < 245))
    border_rgb = np.concatenate(
        [
            rgb[0, :, :],
            rgb[height - 1, :, :],
            rgb[:, 0, :],
            rgb[:, width - 1, :],
        ],
        axis=0,
    )
    border_alpha = np.concatenate(
        [
            alpha[0, :],
            alpha[height - 1, :],
            alpha[:, 0],
            alpha[:, width - 1],
        ],
        axis=0,
    )

    if transparent_ratio > 0.02 and float(np.mean(border_alpha < 245)) > 0.10:
        return {
            "type": "transparent",
            "color": [0, 0, 0],
            "solid": False,
            "variation": 0.0,
        }

    opaque_border = border_rgb[border_alpha > 220]
    if opaque_border.size == 0:
        opaque_border = border_rgb

    background_color = np.median(opaque_border, axis=0)
    distances = np.linalg.norm(opaque_border - background_color, axis=1)
    variation = float(np.percentile(distances, 90))
    brightness = float(np.mean(background_color))
    solid = variation < 34

    if solid and brightness > 232:
        background_type = "white"
    elif solid and brightness < 35:
        background_type = "black"
    elif solid:
        background_type = "solid"
    else:
        background_type = "complex"

    return {
        "type": background_type,
        "color": [int(value) for value in background_color],
        "solid": solid,
        "variation": round(variation, 2),
    }


def remove_simple_background(image: Image.Image, background: dict) -> tuple[Image.Image, bool]:
    """Remove simple solid background connected to image borders."""
    if background["type"] in {"transparent", "complex"} or not background["solid"]:
        return image.convert("RGBA"), False

    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3].astype(np.int16)
    alpha = rgba[:, :, 3]
    background_color = np.array(background["color"], dtype=np.int16)
    distances = np.linalg.norm(rgb - background_color, axis=2)
    tolerance = max(30, min(72, int(background["variation"]) + 34))

    if background["type"] == "white":
        candidate_mask = (distances <= tolerance) | np.all(rgb > 236, axis=2)
    elif background["type"] == "black":
        candidate_mask = (distances <= tolerance) | np.all(rgb < 28, axis=2)
    else:
        candidate_mask = distances <= tolerance

    candidate_mask &= alpha > 0
    label_count, labels = cv2.connectedComponents(candidate_mask.astype(np.uint8), 8)
    if label_count <= 1:
        return Image.fromarray(rgba, "RGBA"), False

    border_labels = set(labels[0, :])
    border_labels.update(labels[-1, :])
    border_labels.update(labels[:, 0])
    border_labels.update(labels[:, -1])
    border_labels.discard(0)

    if not border_labels:
        return Image.fromarray(rgba, "RGBA"), False

    remove_mask = np.isin(labels, list(border_labels))
    removed_ratio = float(np.mean(remove_mask))
    if removed_ratio < 0.01:
        return Image.fromarray(rgba, "RGBA"), False

    blurred_mask = cv2.GaussianBlur(
        remove_mask.astype(np.float32),
        (0, 0),
        sigmaX=0.85,
        sigmaY=0.85,
    )
    new_alpha = alpha.astype(np.float32) * (1.0 - np.clip(blurred_mask, 0.0, 1.0))
    new_alpha[remove_mask] = 0
    rgba[:, :, 3] = np.clip(new_alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA"), True


def crop_transparent_borders(image: Image.Image, padding: int = 14) -> tuple[Image.Image, list[int]]:
    """Crop transparent or empty borders around visible artwork."""
    rgba = np.array(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible_y, visible_x = np.where(alpha > 12)

    if len(visible_x) == 0 or len(visible_y) == 0:
        width, height = image.size
        return image.convert("RGBA"), [0, 0, width, height]

    left = max(0, int(visible_x.min()) - padding)
    top = max(0, int(visible_y.min()) - padding)
    right = min(image.width, int(visible_x.max()) + padding + 1)
    bottom = min(image.height, int(visible_y.max()) + padding + 1)
    return image.crop((left, top, right, bottom)).convert("RGBA"), [left, top, right, bottom]


def dominant_logo_colors(image: Image.Image) -> tuple[int, list[dict]]:
    """Return practical embroidery color count and dominant visible colors."""
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    visible_rgb = rgb[alpha > 40]

    if len(visible_rgb) == 0:
        return 0, []

    sample_step = max(1, len(visible_rgb) // 30000)
    samples = visible_rgb[::sample_step]
    rounded_unique = np.unique((samples // 24) * 24, axis=0)
    cluster_count = int(max(1, min(8, len(rounded_unique), len(samples))))

    if cluster_count <= 1:
        color = np.mean(samples, axis=0).astype(int)
        return 1, [{"hex": rgb_to_hex(color), "rgb": [int(value) for value in color], "percentage": 1.0}]

    sample_float = samples.astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 24, 0.8)
    _, labels, centers = cv2.kmeans(
        sample_float,
        cluster_count,
        None,
        criteria,
        4,
        cv2.KMEANS_PP_CENTERS,
    )
    counts = np.bincount(labels.ravel(), minlength=cluster_count)
    order = np.argsort(counts)[::-1]
    total = float(counts.sum())
    dominant_colors = []

    for index in order[:6]:
        percentage = float(counts[index] / total) if total else 0.0
        if percentage < 0.015:
            continue

        center = np.clip(centers[index], 0, 255).astype(int)
        dominant_colors.append(
            {
                "hex": rgb_to_hex(center),
                "rgb": [int(value) for value in center],
                "percentage": round(percentage, 3),
            }
        )

    colors_count = int(np.sum((counts / total) >= 0.02)) if total else 0
    return max(colors_count, len(dominant_colors)), dominant_colors


def relative_luminance(rgb_values: np.ndarray) -> np.ndarray:
    """Calculate relative luminance from RGB values."""
    normalized = rgb_values.astype(np.float32) / 255.0
    linear = np.where(
        normalized <= 0.03928,
        normalized / 12.92,
        ((normalized + 0.055) / 1.055) ** 2.4,
    )
    return (
        0.2126 * linear[..., 0]
        + 0.7152 * linear[..., 1]
        + 0.0722 * linear[..., 2]
    )


def calculate_contrast_score(image: Image.Image, tee_color: str) -> int:
    """Score logo contrast against black or white shirt."""
    rgba = np.array(image.convert("RGBA"))
    visible_rgb = rgba[:, :, :3][rgba[:, :, 3] > 40]
    if len(visible_rgb) == 0:
        return 0

    logo_luminance = float(np.median(relative_luminance(visible_rgb)))
    shirt_rgb = np.array([245, 241, 232] if tee_color == "white" else [5, 6, 7])
    shirt_luminance = float(relative_luminance(shirt_rgb))
    contrast_ratio = (max(logo_luminance, shirt_luminance) + 0.05) / (
        min(logo_luminance, shirt_luminance) + 0.05
    )
    return int(round(max(0, min(100, ((contrast_ratio - 1) / 6.0) * 100))))


def logo_detail_metrics(image: Image.Image) -> dict:
    """Measure detail density and tiny separated pieces."""
    rgba = np.array(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    visible_mask = alpha > 40
    visible_pixels = int(np.sum(visible_mask))

    if visible_pixels == 0:
        return {
            "edge_density": 0.0,
            "tiny_components": 0,
            "visible_ratio": 0.0,
        }

    gray = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 60, 150)
    edge_density = float(np.mean(edges[visible_mask] > 0))
    _, _, stats, _ = cv2.connectedComponentsWithStats(visible_mask.astype(np.uint8), 8)
    tiny_limit = max(12, int(visible_pixels * 0.0012))
    tiny_components = int(np.sum(stats[1:, cv2.CC_STAT_AREA] < tiny_limit))
    visible_ratio = float(visible_pixels / visible_mask.size)

    return {
        "edge_density": round(edge_density, 3),
        "tiny_components": tiny_components,
        "visible_ratio": round(visible_ratio, 3),
    }


def build_logo_guidance(
    image: Image.Image,
    colors_count: int,
    contrast_score: int,
    detail_metrics: dict,
    background_removed: bool,
    background_type: str,
) -> tuple[bool, list[str], list[str]]:
    """Create embroidery readiness warnings and recommendations."""
    warnings = []
    recommendations = []

    if background_type == "complex" and not background_removed:
        warnings.append("Background is complex and could not be removed automatically.")
        recommendations.append("Upload a PNG with transparency or a logo on a plain white/black background.")

    if colors_count > PRACTICAL_THREAD_COLOR_LIMIT:
        warnings.append(
            "Logo has more than 15 thread colors. Manual review or color reduction may be needed."
        )
        recommendations.append("Reduce the palette to 15 thread colors or fewer for normal production.")

    if contrast_score < 42:
        warnings.append("Logo contrast is low on the selected T-shirt color.")
        recommendations.append("Use brighter colors on black shirts or darker colors on white shirts.")

    if min(image.size) < 90:
        warnings.append("Logo resolution is low after cropping.")
        recommendations.append("Upload a higher resolution logo for sharper stitch planning.")

    if detail_metrics["edge_density"] > 0.24:
        warnings.append("Logo has dense detail that may not stitch cleanly.")
        recommendations.append("Use thicker lines and fewer tiny details.")

    if detail_metrics["tiny_components"] > 28:
        warnings.append("Logo contains many tiny isolated details or possible small text.")
        recommendations.append("Avoid very small text; embroidery needs readable shapes.")

    if detail_metrics["visible_ratio"] < 0.025:
        warnings.append("Visible logo area is very small after cleanup.")
        recommendations.append("Crop tighter or use a larger, bolder mark.")

    if not warnings:
        recommendations.append("Logo is suitable for a clean embroidery preview.")

    embroidery_ready = (
        colors_count <= PRACTICAL_THREAD_COLOR_LIMIT
        and contrast_score >= 42
        and min(image.size) >= 90
        and detail_metrics["visible_ratio"] >= 0.025
        and background_type != "complex"
    )

    return embroidery_ready, warnings, recommendations


def kmeans_quantize(image_bgr: np.ndarray, k: int) -> np.ndarray:
    """Color-reduce an image with OpenCV k-means (k clusters)."""
    Z = image_bgr.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, _ = cv2.kmeans(Z, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    return labels.reshape(image_bgr.shape[:2])


def estimate_complexity(
    stitches: int,
    colors: int,
    coverage: float,
    placement: str,
) -> tuple[str, list[str], list[str]]:
    """Return embroidery complexity with customer-friendly guidance."""
    warnings: list[str] = []
    recommendations: list[str] = []

    if stitches < 8000 and colors <= 3 and coverage <= 0.35:
        complexity = "Easy"
    elif (
        stitches < 25000
        and colors <= PRACTICAL_THREAD_COLOR_LIMIT
        and coverage <= 0.55
    ):
        complexity = "Medium"
    elif (
        stitches < 60000
        and colors <= PRACTICAL_THREAD_COLOR_LIMIT
        and coverage <= 0.75
    ):
        complexity = "Advanced"
    else:
        complexity = "Heavy"

    if placement == "left" and stitches > 18000:
        warnings.append(
            "This is detailed for a small chest logo. A simpler version may be cheaper."
        )
        recommendations.append("For cheaper production, use fewer colors and bigger shapes.")
    if placement == "left" and stitches > 25000:
        warnings.append("This design is too detailed for instant price.")
        recommendations.append("Use a simpler badge version for a fast left chest quote.")
    if stitches > 50000:
        warnings.append("Large detailed embroidery needs manual review.")
        recommendations.append("Reduce detail or choose a smaller, cleaner design area.")
    if coverage > 0.65:
        warnings.append("High coverage may increase stitch time and cost.")
        recommendations.append("Use more open space for a softer and cheaper stitched finish.")
    if colors > CHEAP_PRODUCT_COLOR_LIMIT:
        warnings.append("For best price, keep the design around 4–6 colors.")
        recommendations.append("Best result: 4–6 colors.")
    if colors > MANUAL_REVIEW_COLOR_LIMIT:
        warnings.append("This color palette is complex and may need review.")
        recommendations.append("Reduce colors for a cleaner stitched result.")
    if colors > PRACTICAL_THREAD_COLOR_LIMIT:
        warnings.append(
            "Logo has more than 15 thread colors. Manual review or color reduction may be needed."
        )
        recommendations.append("Reduce the design to 15 colors or fewer.")
    if stitches < 1000:
        warnings.append("Very low stitch count. The design may be too small or too empty.")
        recommendations.append("Use bigger shapes so the logo reads clearly on fabric.")

    if not recommendations:
        recommendations.append("Best price is usually reached with clean shapes and 4–6 colors.")

    return complexity, warnings, recommendations


def calculate_machine_time_minutes(stitches: int, colors: int) -> float:
    """Estimate real production time, including setup and thread changes."""
    stitch_minutes = stitches / MACHINE_SPEED_SPM if MACHINE_SPEED_SPM else 0
    color_change_minutes = max(0, colors - 1) * THREAD_CHANGE_SECONDS / 60
    total = stitch_minutes + color_change_minutes + SETUP_MINUTES
    return round(total, 1)


def calculate_price(
    stitches: int,
    colors: int,
    placement: str,
) -> tuple[float | None, float, float | None, bool, str, dict]:
    """Affordable student-market pricing for embroidered T-shirts."""
    is_left_chest = placement == "left"
    backing = BACKING_LEFT_EUR if is_left_chest else BACKING_CENTER_EUR
    thread_and_bobbin = (
        stitches / 1000.0
    ) * THREAD_AND_BOBBIN_PER_1000_STITCHES_EUR
    color_complexity_fee = (
        max(0, colors - CHEAP_PRODUCT_COLOR_LIMIT) * COLOR_COMPLEXITY_FEE_EUR
    )

    if is_left_chest:
        if stitches < 18000:
            labor = 2.50
        elif stitches <= 25000:
            labor = 3.50
        else:
            labor = 3.50
    else:
        if stitches < 35000:
            labor = 4.50
        elif stitches <= 50000:
            labor = 6.50
        else:
            labor = 6.50

    internal_cost = (
        BLANK_TSHIRT_EUR
        + backing
        + thread_and_bobbin
        + NEEDLE_WEAR_EUR
        + ELECTRICITY_EUR
        + PACKAGING_EUR
        + WASTE_BUFFER_EUR
        + MACHINE_PAYBACK_EUR
        + labor
        + color_complexity_fee
    )

    manual_quote = (
        colors > PRACTICAL_THREAD_COLOR_LIMIT
        or stitches >= MANUAL_QUOTE_STITCH_LIMIT
        or (is_left_chest and stitches > 25000)
        or (not is_left_chest and stitches > 50000)
    )

    pricing_tier = "Manual quote"
    price: float | None = None
    profit: float | None = None

    if not manual_quote:
        if is_left_chest:
            if stitches <= 10000 and colors <= 4:
                price = 9.99
                pricing_tier = "Simple left chest"
            elif stitches <= 18000 and colors <= CHEAP_PRODUCT_COLOR_LIMIT:
                price = 11.99
                pricing_tier = "Standard left chest"
            elif stitches <= 25000:
                price = 15.99
                pricing_tier = "Detailed left chest"
            price = max(9.99, min(15.99, price or 15.99))
        else:
            if stitches <= 25000 and colors <= CHEAP_PRODUCT_COLOR_LIMIT:
                price = 19.99
                pricing_tier = "Simple center front"
            elif stitches <= 35000:
                price = 24.99
                pricing_tier = "Standard center front"
            else:
                price = 29.99
                pricing_tier = "Detailed center front"
            price = max(17.99, min(29.99, price))

        profit = price - internal_cost

    breakdown = {
        "blank_tshirt_eur": round(BLANK_TSHIRT_EUR, 2),
        "backing_eur": round(backing, 2),
        "thread_and_bobbin_eur": round(thread_and_bobbin, 2),
        "needle_wear_eur": round(NEEDLE_WEAR_EUR, 2),
        "electricity_eur": round(ELECTRICITY_EUR, 2),
        "packaging_eur": round(PACKAGING_EUR, 2),
        "waste_buffer_eur": round(WASTE_BUFFER_EUR, 2),
        "machine_payback_eur": round(MACHINE_PAYBACK_EUR, 2),
        "labor_eur": round(labor, 2),
        "color_complexity_fee_eur": round(color_complexity_fee, 2),
    }

    return (
        round(price, 2) if price is not None else None,
        round(internal_cost, 2),
        round(profit, 2) if profit is not None else None,
        manual_quote,
        pricing_tier,
        breakdown,
    )


def build_internal_production_notes(
    stitches: int,
    colors: int,
    coverage: float,
    placement: str,
    manual_quote: bool,
) -> list[str]:
    """Return internal-only production decision labels for the studio view."""
    notes: list[str] = []
    is_left_chest = placement == "left"

    if (
        not manual_quote
        and colors <= CHEAP_PRODUCT_COLOR_LIMIT
        and coverage <= 0.55
        and (
            (is_left_chest and stitches <= 18000)
            or (not is_left_chest and stitches <= 35000)
        )
    ):
        notes.append("Good for cheap product")

    if manual_quote:
        notes.append("Manual review")

    if (
        colors > CHEAP_PRODUCT_COLOR_LIMIT
        or coverage > 0.65
        or (is_left_chest and stitches > 18000)
        or (not is_left_chest and stitches > 35000)
    ):
        notes.append("Needs simplification")

    if (
        stitches >= MANUAL_QUOTE_STITCH_LIMIT
        or (is_left_chest and stitches > 25000)
        or (not is_left_chest and stitches > 50000)
    ):
        notes.append("Too many stitches")

    if colors > PRACTICAL_THREAD_COLOR_LIMIT:
        notes.append("Too many colors")

    if coverage > 0.65:
        notes.append("High coverage")

    return notes or ["Ready for embroidery"]


@app.post("/estimate")
async def estimate(
    file: UploadFile = File(...),
    width_mm: float = Form(80.0),
    height_mm: float = Form(60.0),
    colors: int = Form(2),
    product_type: str = Form("tshirt"),
):
    """Estimate stitches, readiness and affordable retail price from an uploaded image."""
    data = await file.read()
    img = Image.open(BytesIO(data)).convert("RGB")
    img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    reported_colors = max(1, int(colors))
    k = max(1, min(PRACTICAL_THREAD_COLOR_LIMIT, reported_colors))
    labelmap = kmeans_quantize(img_bgr, k)

    counts = np.bincount(labelmap.ravel())
    bg = int(np.argmax(counts))
    coverage = float(1.0 - counts[bg] / counts.sum())

    area_in2 = (width_mm * height_mm) / 645.16  # 1 in² = 645.16 mm²
    STITCHES_PER_IN2 = 1800
    stitches = int(area_in2 * coverage * STITCHES_PER_IN2)

    placement = "left" if width_mm <= 100 and height_mm <= 80 else "center"
    machine_time_minutes = calculate_machine_time_minutes(
        stitches, reported_colors
    )
    complexity, warnings, recommendations = estimate_complexity(
        stitches, reported_colors, coverage, placement
    )
    (
        price,
        internal_cost,
        estimated_profit,
        manual_quote,
        pricing_tier,
        cost_breakdown,
    ) = calculate_price(stitches, reported_colors, placement)

    product = PRODUCT_PRESETS.get(product_type, PRODUCT_PRESETS["tshirt"])
    compatible_area = (
        width_mm <= product["max_width_mm"]
        and height_mm <= product["max_height_mm"]
    )

    if not compatible_area:
        warnings.append(
            f"Design area is too large for {product['label']} preset. Reduce size or choose another product."
        )
        recommendations.append("Choose a smaller placement for an instant price.")
        manual_quote = True
        price = None
        estimated_profit = None
        pricing_tier = "Manual quote"

    quote_status = (
        "Ready for embroidery"
        if compatible_area and not manual_quote
        else "Needs review"
    )
    profit_margin_percent = (
        round((estimated_profit / price) * 100, 1)
        if price and estimated_profit is not None
        else None
    )
    public_quote = {
        "stitches": stitches,
        "colors": reported_colors,
        "coverage": coverage,
        "price_eur": price,
        "manual_quote": manual_quote,
        "pricing_tier": pricing_tier,
        "customer_warnings": warnings,
        "customer_recommendations": recommendations,
    }
    internal_quote = {
        "internal_cost_eur": internal_cost,
        "estimated_profit_eur": estimated_profit,
        "profit_margin_percent": profit_margin_percent,
        "cost_breakdown": cost_breakdown,
        "technical_warnings": warnings,
        "production_notes": build_internal_production_notes(
            stitches,
            reported_colors,
            coverage,
            placement,
            manual_quote,
        ),
    }

    return {
        # Structured response for customer and private studio views
        "public_quote": public_quote,
        "internal_quote": internal_quote,
        # Existing fields used by the frontend
        "stitches": stitches,
        "colors": reported_colors,
        "coverage": coverage,
        "price_eur": price,
        "width_mm": width_mm,
        "height_mm": height_mm,
        # Pricing and readiness fields
        "product_type": product_type,
        "product_label": product["label"],
        "machine_time_minutes": machine_time_minutes,
        "complexity": complexity,
        "machine_status": quote_status,
        "quote_status": quote_status,
        "compatible_area": compatible_area,
        "manual_quote": manual_quote,
        "pricing_tier": pricing_tier,
        "internal_cost_eur": internal_cost,
        "estimated_profit_eur": estimated_profit,
        "warnings": warnings,
        "recommendations": recommendations,
        "cost_breakdown": cost_breakdown,
    }


@app.post("/analyze_logo")
async def analyze_logo(
    file: UploadFile = File(...),
    tee_color: str = Form("black"),
):
    """Clean logo background and return embroidery-readiness analysis."""
    data = await file.read()
    original = resize_for_analysis(Image.open(BytesIO(data)))
    background = detect_background(original)
    cleaned, background_removed = remove_simple_background(original, background)
    cropped, crop_box = crop_transparent_borders(cleaned)

    if max(cropped.size) > 900:
        cropped.thumbnail((900, 900), Image.Resampling.LANCZOS)

    colors_count, dominant_colors = dominant_logo_colors(cropped)
    normalized_tee_color = "white" if tee_color == "white" else "black"
    contrast_score = calculate_contrast_score(cropped, normalized_tee_color)
    detail_metrics = logo_detail_metrics(cropped)
    embroidery_ready, warnings, recommendations = build_logo_guidance(
        cropped,
        colors_count,
        contrast_score,
        detail_metrics,
        background_removed,
        background["type"],
    )

    return {
        "processed_png": image_to_png_data_url(cropped),
        "background_type": background["type"],
        "background_color": {
            "hex": rgb_to_hex(background["color"]),
            "rgb": background["color"],
        },
        "background_removed": background_removed,
        "crop_box": crop_box,
        "colors_count": colors_count,
        "dominant_colors": dominant_colors,
        "contrast_score": contrast_score,
        "embroidery_ready": embroidery_ready,
        "warnings": warnings,
        "recommendations": recommendations,
        "detail_metrics": detail_metrics,
    }


@app.post("/prepare_design")
async def prepare_design(
    customer_prompt: str = Form(...),
    placement: str = Form("left"),
    width_mm: float = Form(90.0),
    height_mm: float = Form(60.0),
    shirt_color: str = Form("black"),
    max_colors: int = Form(PRACTICAL_THREAD_COLOR_LIMIT),
):
    """Prepare a customer idea as embroidery-ready design direction."""
    return prepare_embroidery_design(
        customer_prompt=customer_prompt,
        placement=placement,
        width_mm=width_mm,
        height_mm=height_mm,
        shirt_color=shirt_color,
        max_colors=max_colors,
    )


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
async def generate_logo(
    prompt: str = Form("embroidery-ready design"),
    placement: str = Form("left"),
    width_mm: float = Form(90.0),
    height_mm: float = Form(60.0),
    shirt_color: str = Form("black"),
    max_colors: int = Form(PRACTICAL_THREAD_COLOR_LIMIT),
):
    """Return a temporary generated PNG logo placeholder.

    Later this endpoint can be replaced by the local AI server.
    """
    prepared = prepare_embroidery_design(
        customer_prompt=prompt,
        placement=placement,
        width_mm=width_mm,
        height_mm=height_mm,
        shirt_color=shirt_color,
        max_colors=max_colors,
    )
    img = make_logo(prepared["embroidery_prompt"])
    buf = BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.get("/")
def health():
    """Simple liveness endpoint."""
    return {
        "status": "ok",
        "service": "stitchra-embroidery-api",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
