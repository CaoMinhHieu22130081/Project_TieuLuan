from __future__ import annotations

import base64
import io
import json
import os
import re
import threading
import time
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import numpy as np
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    faiss = None

try:
    import torch  # type: ignore
    from transformers import AutoModel, AutoProcessor, CLIPModel, CLIPProcessor  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    torch = None
    AutoModel = None
    AutoProcessor = None
    CLIPModel = None
    CLIPProcessor = None


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8080/api/products")
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "http://localhost:8080")
HTTP_TIMEOUT_SECONDS = float(os.getenv("AI_HTTP_TIMEOUT_SECONDS", "12"))
OPENAI_CLIP_MODEL = "openai/clip-vit-base-patch32"
DEFAULT_FASHION_MODEL = "patrickjohncyh/fashion-clip"
DEFAULT_CLIP_MODEL = DEFAULT_FASHION_MODEL
VISION_MODEL_NAME = os.getenv("AI_VISION_MODEL", DEFAULT_FASHION_MODEL).strip() or DEFAULT_FASHION_MODEL
VISION_MODEL_KIND = os.getenv("AI_VISION_MODEL_KIND", "auto").strip().lower() or "auto"
VISION_MODEL_TRUST_REMOTE_CODE = _env_bool("AI_VISION_MODEL_TRUST_REMOTE_CODE", True)
GR_LITE_IMAGE_SIZE = int(os.getenv("AI_GR_LITE_IMAGE_SIZE", "336"))
DEFAULT_LIMIT = int(os.getenv("AI_SEARCH_DEFAULT_LIMIT", "5"))
MAX_LIMIT = int(os.getenv("AI_SEARCH_MAX_LIMIT", "12"))
TYPE_SCORE_THRESHOLD = float(os.getenv("AI_TYPE_SCORE_THRESHOLD", "0.2"))
TYPE_MARGIN_THRESHOLD = float(os.getenv("AI_TYPE_MARGIN_THRESHOLD", "0.04"))
TYPE_CONFIDENCE_MARGIN_HIGH = float(os.getenv("AI_TYPE_CONFIDENCE_MARGIN_HIGH", "0.12"))
TYPE_FALLBACK_MIN_MATCHES = int(os.getenv("AI_TYPE_FALLBACK_MIN_MATCHES", "3"))
TYPE_FALLBACK_RATIO = float(os.getenv("AI_TYPE_FALLBACK_RATIO", "0.6"))
TYPE_FILTER_MIN_CONFIDENCE = int(os.getenv("AI_TYPE_FILTER_MIN_CONFIDENCE", "75"))
INDEX_TTL_SECONDS = float(os.getenv("AI_INDEX_TTL_SECONDS", "600"))
INDEX_MAX_IMAGES_PER_PRODUCT = int(os.getenv("AI_INDEX_MAX_IMAGES_PER_PRODUCT", "4"))
INDEX_CANDIDATE_MULTIPLIER = int(os.getenv("AI_INDEX_CANDIDATE_MULTIPLIER", "6"))
INDEX_CANDIDATE_MIN = int(os.getenv("AI_INDEX_CANDIDATE_MIN", "24"))
TEXT_SIMILARITY_WEIGHT = float(os.getenv("AI_TEXT_SIMILARITY_WEIGHT", "0.15"))
MIN_RESULT_SIMILARITY = int(os.getenv("AI_MIN_RESULT_SIMILARITY", "30"))
NO_RESULT_REASON = os.getenv(
    "AI_NO_RESULT_REASON",
    "Không tìm thấy sản phẩm đủ tương đồng. Hãy thử ảnh rõ hơn, nền gọn hơn hoặc chụp chính diện sản phẩm.",
)
ENABLE_FOREGROUND_CROP = _env_bool("AI_ENABLE_FOREGROUND_CROP", True)
FOREGROUND_CROP_MAX_SIDE = int(os.getenv("AI_FOREGROUND_CROP_MAX_SIDE", "384"))
FOREGROUND_CROP_DIFF_THRESHOLD = float(os.getenv("AI_FOREGROUND_CROP_DIFF_THRESHOLD", "30"))
FOREGROUND_CROP_SATURATION_THRESHOLD = float(os.getenv("AI_FOREGROUND_CROP_SATURATION_THRESHOLD", "45"))
FOREGROUND_CROP_MIN_COVERAGE = float(os.getenv("AI_FOREGROUND_CROP_MIN_COVERAGE", "0.02"))
FOREGROUND_CROP_MAX_COVERAGE = float(os.getenv("AI_FOREGROUND_CROP_MAX_COVERAGE", "0.92"))
FOREGROUND_CROP_MARGIN_RATIO = float(os.getenv("AI_FOREGROUND_CROP_MARGIN_RATIO", "0.08"))
ENABLE_SEGMENTATION = _env_bool("AI_ENABLE_SEGMENTATION", True)
SEGMENTATION_MODE = os.getenv("AI_SEGMENTATION_MODE", "rembg").strip().lower() or "rembg"
SEGMENTATION_MODEL = os.getenv("AI_SEGMENTATION_MODEL", "u2netp").strip() or "u2netp"
SEGMENTATION_ALPHA_THRESHOLD = int(os.getenv("AI_SEGMENTATION_ALPHA_THRESHOLD", "16"))
SEGMENTATION_MIN_COVERAGE = float(os.getenv("AI_SEGMENTATION_MIN_COVERAGE", "0.015"))
SEGMENTATION_MAX_COVERAGE = float(os.getenv("AI_SEGMENTATION_MAX_COVERAGE", "0.96"))
SEGMENTATION_MARGIN_RATIO = float(os.getenv("AI_SEGMENTATION_MARGIN_RATIO", "0.08"))
INDEX_CACHE_VERSION = "v3-fashionclip-segmentation"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss.index")
NUMPY_INDEX_PATH = os.path.join(DATA_DIR, "matrix.npy")
METADATA_PATH = os.path.join(DATA_DIR, "metadata.json")

TYPE_PROMPTS = {
    "Áo": [
        "a photo of a shirt",
        "a photo of a t-shirt",
        "a photo of a tee",
        "a photo of a top",
        "upper body clothing",
        "upper body garment",
        "áo thun",
        "áo phông",
        "áo graphic",
        "áo oversized",
        "áo vintage",
        "áo thể thao",
        "áo sọc kẻ",
        "áo cơ bản",
        "t-shirt",
        "shirt",
        "tee",
        "unisex top",
    ],
    "Quần": [
        "a photo of pants",
        "a photo of trousers",
        "a photo of jeans",
        "a photo of shorts",
        "lower body clothing",
        "lower body garment",
        "quần jean",
        "quần tây",
        "quần jeans",
        "quần jogger",
        "quần cargo",
        "quần short",
        "quần kaki",
        "pants",
        "trousers",
        "jeans",
        "jogger pants",
        "cargo pants",
        "shorts",
    ],
}

TYPE_ALIASES = {
    "Áo": [
        "ao",
        "aothun",
        "aophong",
        "aographic",
        "aooversized",
        "aovintage",
        "aothethao",
        "aosocke",
        "aocoban",
        "graphic",
        "oversized",
        "vintage",
        "thethao",
        "socke",
        "coban",
        "tshirt",
        "shirt",
        "tee",
        "top",
    ],
    "Quần": [
        "quan",
        "quanjean",
        "quantay",
        "quanjeans",
        "quanjogger",
        "quancargo",
        "quanshort",
        "quankaki",
        "pants",
        "pant",
        "trousers",
        "trouser",
        "jeans",
        "jean",
        "jogger",
        "cargo",
        "short",
        "shorts",
        "kaki",
    ],
}

try:
    RESAMPLE = Image.Resampling.LANCZOS  # Pillow >= 9
except AttributeError:  # pragma: no cover - older Pillow fallback
    RESAMPLE = Image.LANCZOS


session = requests.Session()
session.headers.update({"User-Agent": "UniqTee-Visual-Search/1.0"})

app = FastAPI(title="UniqTee Visual Search Module", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _normalize_vector(vector: np.ndarray) -> np.ndarray:
    vector = np.asarray(vector, dtype=np.float32).reshape(-1)
    norm = float(np.linalg.norm(vector))
    if norm == 0.0:
        return vector
    return vector / norm


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _resolve_url(raw_url: Any) -> Optional[str]:
    if not raw_url:
        return None

    url = str(raw_url).strip()
    if not url:
        return None

    if url.startswith("data:"):
        return url

    parsed = urlparse(url)
    if parsed.scheme in {"http", "https"}:
        return url

    if url.startswith("//"):
        return "https:" + url

    if url.startswith("/"):
        return urljoin(ASSET_BASE_URL.rstrip("/") + "/", url.lstrip("/"))

    return urljoin(ASSET_BASE_URL.rstrip("/") + "/", url)


def _extract_image_url(product: Dict[str, Any]) -> Optional[str]:
    image_urls = _extract_image_urls(product)
    if image_urls:
        return image_urls[0]

    return None


def _extract_image_urls(product: Dict[str, Any]) -> List[str]:
    images = product.get("images") or []
    image_urls: List[str] = []
    seen_urls = set()

    for image in images:
        if isinstance(image, dict):
            candidate = image.get("url") or image.get("src") or image.get("image")
        elif isinstance(image, str):
            candidate = image
        else:
            candidate = None

        resolved = _resolve_url(candidate)
        if resolved and resolved not in seen_urls:
            seen_urls.add(resolved)
            image_urls.append(resolved)

    for key in ("image", "imageUrl", "thumbnail", "thumbnailUrl"):
        resolved = _resolve_url(product.get(key))
        if resolved and resolved not in seen_urls:
            seen_urls.add(resolved)
            image_urls.append(resolved)

    return image_urls


def _extract_text_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, dict):
        for key in ("name", "title", "label"):
            nested_value = value.get(key)
            if nested_value:
                return str(nested_value)
        return None
    text = str(value).strip()
    return text or None


def _fold_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return stripped.lower().strip()


def _guess_type_from_text(value: str) -> Optional[str]:
    folded = _fold_text(value)
    if not folded:
        return None

    compact = "".join(char for char in folded if char.isalnum())
    tokens = [token for token in re.split(r"[^a-z0-9]+", folded) if token]

    for canonical_type, aliases in TYPE_ALIASES.items():
        for alias in aliases:
            if compact == alias:
                return canonical_type
            if alias in tokens:
                return canonical_type
            if len(alias) >= 4 and alias in compact:
                return canonical_type

    return None


def _normalize_type(value: Any) -> Optional[str]:
    if value is None:
        return None
    return _guess_type_from_text(str(value))


def _extract_product_type(product: Dict[str, Any]) -> Optional[str]:
    if not isinstance(product, dict):
        return None

    direct_type = _normalize_type(product.get("type"))
    if direct_type:
        return direct_type

    category = product.get("category")
    if isinstance(category, dict):
        category_type = _normalize_type(category.get("type"))
        if category_type:
            return category_type

        category_name = _normalize_type(category.get("name"))
        if category_name:
            return category_name
    elif isinstance(category, str):
        category_name = _normalize_type(category)
        if category_name:
            return category_name

    for key in ("tag", "name", "description"):
        candidate = _normalize_type(_extract_text_value(product.get(key)))
        if candidate:
            return candidate

    return None


def _infer_type_from_results(results: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    counts: Dict[str, int] = {}
    for result in results:
        normalized = (
            _normalize_type(result.get("type"))
            or _normalize_type(result.get("category"))
            or _normalize_type(result.get("tag"))
            or _normalize_type(result.get("name"))
        )
        if normalized:
            counts[normalized] = counts.get(normalized, 0) + 1

    if not counts:
        return None

    total = sum(counts.values())
    best_type, best_count = max(counts.items(), key=lambda item: item[1])

    if best_count < TYPE_FALLBACK_MIN_MATCHES:
        return None

    ratio = best_count / max(total, 1)
    if ratio < TYPE_FALLBACK_RATIO:
        return None

    return {
        "type": best_type,
        "confidence": int(round(ratio * 100)),
    }


def _infer_type_from_ranked_entries(entries: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    counts: Dict[str, int] = {}
    for entry in entries:
        product = entry.get("product")
        if not isinstance(product, dict):
            continue
        product_type = _extract_product_type(product)
        if product_type:
            counts[product_type] = counts.get(product_type, 0) + 1

    if not counts:
        return None

    total = sum(counts.values())
    best_type, best_count = max(counts.items(), key=lambda item: item[1])
    if best_count < TYPE_FALLBACK_MIN_MATCHES:
        return None

    ratio = best_count / max(total, 1)
    if ratio < TYPE_FALLBACK_RATIO:
        return None

    return {
        "type": best_type,
        "confidence": int(round(ratio * 100)),
    }


def _load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


def _auto_crop_foreground(image: Image.Image) -> Image.Image:
    if not ENABLE_FOREGROUND_CROP:
        return ImageOps.exif_transpose(image).convert("RGB")

    original = ImageOps.exif_transpose(image).convert("RGB")
    width, height = original.size
    if width < 80 or height < 80:
        return original

    sample = original.copy()
    sample.thumbnail((FOREGROUND_CROP_MAX_SIDE, FOREGROUND_CROP_MAX_SIDE), RESAMPLE)
    sample_width, sample_height = sample.size
    if sample_width < 20 or sample_height < 20:
        return original

    array = np.asarray(sample, dtype=np.float32)
    border_parts = [
        array[0, :, :],
        array[-1, :, :],
        array[:, 0, :],
        array[:, -1, :],
    ]
    border_pixels = np.concatenate(border_parts, axis=0)
    background = np.median(border_pixels, axis=0)

    color_distance = np.linalg.norm(array - background, axis=2)
    saturation = array.max(axis=2) - array.min(axis=2)
    mask = (
        color_distance > FOREGROUND_CROP_DIFF_THRESHOLD
    ) | (
        (color_distance > FOREGROUND_CROP_DIFF_THRESHOLD * 0.65)
        & (saturation > FOREGROUND_CROP_SATURATION_THRESHOLD)
    )

    coverage = float(mask.mean())
    if coverage < FOREGROUND_CROP_MIN_COVERAGE or coverage > FOREGROUND_CROP_MAX_COVERAGE:
        return original

    y_indices, x_indices = np.where(mask)
    if len(x_indices) == 0 or len(y_indices) == 0:
        return original

    left = int(x_indices.min())
    right = int(x_indices.max()) + 1
    top = int(y_indices.min())
    bottom = int(y_indices.max()) + 1

    box_width = right - left
    box_height = bottom - top
    if box_width < sample_width * 0.12 or box_height < sample_height * 0.12:
        return original

    margin = int(round(max(box_width, box_height) * FOREGROUND_CROP_MARGIN_RATIO))
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(sample_width, right + margin)
    bottom = min(sample_height, bottom + margin)

    if (
        left <= sample_width * 0.03
        and top <= sample_height * 0.03
        and right >= sample_width * 0.97
        and bottom >= sample_height * 0.97
    ):
        return original

    scale_x = width / sample_width
    scale_y = height / sample_height
    crop_box = (
        max(0, int(round(left * scale_x))),
        max(0, int(round(top * scale_y))),
        min(width, int(round(right * scale_x))),
        min(height, int(round(bottom * scale_y))),
    )
    if crop_box[2] <= crop_box[0] or crop_box[3] <= crop_box[1]:
        return original

    return original.crop(crop_box)


@lru_cache(maxsize=1)
def _get_rembg_session() -> Any:
    from rembg import new_session  # type: ignore

    return new_session(SEGMENTATION_MODEL)


def _segment_foreground(image: Image.Image) -> Optional[Image.Image]:
    if not ENABLE_SEGMENTATION:
        return None
    if SEGMENTATION_MODE not in {"rembg", "auto"}:
        return None

    original = ImageOps.exif_transpose(image).convert("RGB")
    width, height = original.size
    if width < 80 or height < 80:
        return None

    try:
        from rembg import remove  # type: ignore

        buffer = io.BytesIO()
        original.save(buffer, format="PNG")
        output = remove(
            buffer.getvalue(),
            session=_get_rembg_session(),
            post_process_mask=True,
        )
        segmented = Image.open(io.BytesIO(output)).convert("RGBA")
    except Exception:
        return None

    alpha = np.asarray(segmented.getchannel("A"), dtype=np.uint8)
    mask = alpha > SEGMENTATION_ALPHA_THRESHOLD
    coverage = float(mask.mean())
    if coverage < SEGMENTATION_MIN_COVERAGE or coverage > SEGMENTATION_MAX_COVERAGE:
        return None

    y_indices, x_indices = np.where(mask)
    if len(x_indices) == 0 or len(y_indices) == 0:
        return None

    left = int(x_indices.min())
    right = int(x_indices.max()) + 1
    top = int(y_indices.min())
    bottom = int(y_indices.max()) + 1

    box_width = right - left
    box_height = bottom - top
    if box_width < width * 0.08 or box_height < height * 0.08:
        return None

    margin = int(round(max(box_width, box_height) * SEGMENTATION_MARGIN_RATIO))
    crop_box = (
        max(0, left - margin),
        max(0, top - margin),
        min(width, right + margin),
        min(height, bottom + margin),
    )
    if crop_box[2] <= crop_box[0] or crop_box[3] <= crop_box[1]:
        return None

    foreground = segmented.crop(crop_box)
    background = Image.new("RGBA", foreground.size, (255, 255, 255, 255))
    background.alpha_composite(foreground)
    return background.convert("RGB")


def _preprocess_for_embedding(image: Image.Image) -> Image.Image:
    segmented = _segment_foreground(image)
    if segmented is not None:
        return segmented
    return _auto_crop_foreground(image)


def _index_config_key() -> str:
    return "|".join(
        [
            INDEX_CACHE_VERSION,
            f"crop={int(ENABLE_FOREGROUND_CROP)}",
            f"seg={int(ENABLE_SEGMENTATION)}",
            f"seg_mode={SEGMENTATION_MODE}",
            f"seg_model={SEGMENTATION_MODEL}",
            f"seg_alpha={SEGMENTATION_ALPHA_THRESHOLD}",
            f"seg_min_cov={SEGMENTATION_MIN_COVERAGE}",
            f"seg_max_cov={SEGMENTATION_MAX_COVERAGE}",
            f"seg_margin={SEGMENTATION_MARGIN_RATIO}",
            f"max_side={FOREGROUND_CROP_MAX_SIDE}",
            f"diff={FOREGROUND_CROP_DIFF_THRESHOLD}",
            f"sat={FOREGROUND_CROP_SATURATION_THRESHOLD}",
            f"min_cov={FOREGROUND_CROP_MIN_COVERAGE}",
            f"max_cov={FOREGROUND_CROP_MAX_COVERAGE}",
            f"margin={FOREGROUND_CROP_MARGIN_RATIO}",
        ]
    )


def _no_result_fields(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    no_result = len(results) == 0
    return {
        "noResult": no_result,
        "minSimilarity": MIN_RESULT_SIMILARITY,
        "noResultReason": NO_RESULT_REASON if no_result else None,
    }


def _download_bytes(raw_url: str) -> bytes:
    if raw_url.startswith("data:"):
        header, encoded = raw_url.split(",", 1)
        return base64.b64decode(encoded)

    response = session.get(raw_url, timeout=HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.content


@lru_cache(maxsize=512)
def _cached_download_bytes(raw_url: str) -> bytes:
    return _download_bytes(raw_url)


@lru_cache(maxsize=2048)
def _cached_image_vector(raw_url: str, engine_name: str, index_config_key: str) -> tuple:
    image_bytes = _cached_download_bytes(raw_url)
    image = _load_image_from_bytes(image_bytes)
    vector = engine.encode_image(image)
    return tuple(float(value) for value in np.asarray(vector, dtype=np.float32).reshape(-1))


def _fetch_catalog() -> List[Dict[str, Any]]:
    catalog_response = session.get(CATALOG_URL, timeout=HTTP_TIMEOUT_SECONDS)
    catalog_response.raise_for_status()
    catalog_data = catalog_response.json()

    if isinstance(catalog_data, dict) and isinstance(catalog_data.get("content"), list):
        return catalog_data.get("content", [])

    if isinstance(catalog_data, list):
        return catalog_data

    return []


class VisualSearchEngine:
    def __init__(self) -> None:
        self._clip_ready = False
        self._clip_attempted = False
        self._clip_error: Optional[str] = None
        self._processor = None
        self._model = None
        self._device = "cpu"
        self._model_name = VISION_MODEL_NAME
        self._model_family = self._resolve_model_family(VISION_MODEL_NAME)
        self._text_features: Optional[Dict[str, np.ndarray]] = None
        self._text_cache: Dict[str, np.ndarray] = {}

    def _resolve_model_family(self, model_name: str) -> str:
        if VISION_MODEL_KIND in {"gr_lite", "marqo", "clip"}:
            return VISION_MODEL_KIND

        normalized = model_name.lower()
        if "gr-lite" in normalized:
            return "gr_lite"
        if "marqo-fashion" in normalized:
            return "marqo"
        return "clip"

    def _model_label(self) -> str:
        if self._model_family == "clip" and self._model_name == OPENAI_CLIP_MODEL:
            return "clip"
        if self._model_family == "clip" and self._model_name == DEFAULT_FASHION_MODEL:
            return "fashion-clip"
        return re.sub(r"[^a-zA-Z0-9]+", "-", self._model_name).strip("-").lower()

    def _supports_text_embeddings(self) -> bool:
        return self._model_family in {"clip", "marqo"}

    def _ensure_clip(self) -> bool:
        if self._clip_attempted:
            return self._clip_ready

        self._clip_attempted = True

        if torch is None:
            self._clip_error = "PyTorch is not installed"
            return False

        try:
            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            if self._model_family == "gr_lite":
                if AutoModel is None:
                    self._clip_error = "Transformers AutoModel is not installed"
                    return False
                self._model = AutoModel.from_pretrained(
                    self._model_name,
                    trust_remote_code=VISION_MODEL_TRUST_REMOTE_CODE,
                ).to(self._device)
            elif self._model_family == "marqo":
                if AutoModel is None or AutoProcessor is None:
                    self._clip_error = "Transformers AutoModel/AutoProcessor is not installed"
                    return False
                self._processor = AutoProcessor.from_pretrained(
                    self._model_name,
                    trust_remote_code=VISION_MODEL_TRUST_REMOTE_CODE,
                )
                self._model = AutoModel.from_pretrained(
                    self._model_name,
                    trust_remote_code=VISION_MODEL_TRUST_REMOTE_CODE,
                ).to(self._device)
            else:
                if CLIPModel is None or CLIPProcessor is None:
                    self._clip_error = "CLIP libraries are not installed"
                    return False
                self._processor = CLIPProcessor.from_pretrained(self._model_name)
                self._model = CLIPModel.from_pretrained(self._model_name).to(self._device)

            self._model.eval()
            self._clip_ready = True
            return True
        except Exception as exception:  # pragma: no cover - model download/runtime dependent
            self._clip_error = str(exception)
            self._clip_ready = False
            return False

    def engine_name(self) -> str:
        if self._ensure_clip():
            backend = "faiss" if faiss is not None else "numpy"
            return f"{self._model_label()}-{backend}"
        return "histogram-fallback"

    def encode_image(self, image: Image.Image) -> np.ndarray:
        if self._ensure_clip():
            return self._encode_clip_image(image)

        return self._fallback_vector(image)

    def _encode_clip_image(self, image: Image.Image) -> np.ndarray:
        image = _preprocess_for_embedding(image)
        if self._model_family == "gr_lite":
            return self._encode_gr_lite_image(image)
        if self._model_family == "marqo":
            return self._encode_marqo_image(image)
        return self._encode_hf_clip_image(image)

    def _tensor_to_vector(self, features: Any) -> np.ndarray:
        if hasattr(features, "pooler_output"):
            features = features.pooler_output
        if isinstance(features, (tuple, list)):
            features = features[0]
        if hasattr(features, "dim") and features.dim() == 1:
            features = features.unsqueeze(0)
        features = torch.nn.functional.normalize(features, p=2, dim=-1)
        return features[0].detach().cpu().numpy().astype(np.float32)

    def _prepare_gr_lite_image(self, image: Image.Image) -> Any:
        prepared = ImageOps.exif_transpose(image).convert("RGB").resize(
            (GR_LITE_IMAGE_SIZE, GR_LITE_IMAGE_SIZE),
            RESAMPLE,
        )
        array = np.asarray(prepared, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        array = (array - mean) / std
        array = np.transpose(array, (2, 0, 1)).copy()
        return torch.from_numpy(array).unsqueeze(0).to(self._device)

    def _encode_gr_lite_image(self, image: Image.Image) -> np.ndarray:
        pixel_values = self._prepare_gr_lite_image(image)
        with torch.no_grad():
            outputs = self._model(pixel_values)
        return self._tensor_to_vector(outputs)

    def _encode_marqo_image(self, image: Image.Image) -> np.ndarray:
        try:
            inputs = self._processor(images=[image], return_tensors="pt")
        except Exception:
            inputs = self._processor(text=[""], images=[image], padding="max_length", return_tensors="pt")

        pixel_values = inputs["pixel_values"].to(self._device)
        with torch.no_grad():
            try:
                features = self._model.get_image_features(pixel_values, normalize=True)
            except TypeError:
                features = self._model.get_image_features(pixel_values)
        return self._tensor_to_vector(features)

    def _encode_hf_clip_image(self, image: Image.Image) -> np.ndarray:
        inputs = self._processor(images=image, return_tensors="pt")
        inputs = {key: value.to(self._device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = self._model.get_image_features(**inputs)
        return self._tensor_to_vector(outputs)

    def _get_text_features(self) -> Optional[Dict[str, np.ndarray]]:
        if self._text_features is not None:
            return self._text_features

        if not self._ensure_clip():
            return None
        if not self._supports_text_embeddings():
            return None

        prompts: List[str] = []
        prompt_types: List[str] = []
        for product_type, variants in TYPE_PROMPTS.items():
            for variant in variants:
                if not variant:
                    continue
                prompts.append(variant)
                prompt_types.append(product_type)

        if not prompts:
            return None

        encoded_vectors = [
            vector
            for vector in (self.encode_text(prompt) for prompt in prompts)
            if vector is not None
        ]
        if len(encoded_vectors) != len(prompts):
            return None
        vectors = np.stack(encoded_vectors).astype(np.float32)

        grouped: Dict[str, List[np.ndarray]] = {key: [] for key in TYPE_PROMPTS.keys()}
        for product_type, vector in zip(prompt_types, vectors):
            grouped.setdefault(product_type, []).append(vector)

        self._text_features = {
            product_type: np.stack(type_vectors)
            for product_type, type_vectors in grouped.items()
            if type_vectors
        }
        return self._text_features

    def encode_text(self, text: str) -> Optional[np.ndarray]:
        if not text:
            return None
        if not self._ensure_clip():
            return None
        if not self._supports_text_embeddings():
            return None

        cached = self._text_cache.get(text)
        if cached is not None:
            return cached

        try:
            if self._model_family == "marqo":
                vector = self._encode_marqo_text(text)
            else:
                vector = self._encode_hf_clip_text(text)
            self._text_cache[text] = vector
            return vector
        except Exception:
            return None

    def _encode_marqo_text(self, text: str) -> np.ndarray:
        inputs = self._processor(text=[text], return_tensors="pt", padding="max_length", truncation=True)
        inputs = {key: value.to(self._device) for key, value in inputs.items()}
        with torch.no_grad():
            try:
                features = self._model.get_text_features(inputs["input_ids"], normalize=True)
            except TypeError:
                features = self._model.get_text_features(**inputs)
        return self._tensor_to_vector(features)

    def _encode_hf_clip_text(self, text: str) -> np.ndarray:
        inputs = self._processor(text=[text], return_tensors="pt", padding=True, truncation=True)
        inputs = {key: value.to(self._device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = self._model.get_text_features(**inputs)
        return self._tensor_to_vector(outputs)

    def _predict_type_from_clip(self, query_vector: np.ndarray) -> Optional[Dict[str, Any]]:
        text_features = self._get_text_features()
        if not text_features:
            return None

        scores: Dict[str, float] = {}
        query = query_vector.reshape(-1, 1)
        for product_type, vectors in text_features.items():
            similarities = vectors @ query
            scores[product_type] = float(similarities.max())

        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        if not sorted_scores:
            return None

        best_type, best_score = sorted_scores[0]
        second_score = sorted_scores[1][1] if len(sorted_scores) > 1 else -1.0

        if best_score < TYPE_SCORE_THRESHOLD:
            return None

        if (best_score - second_score) < TYPE_MARGIN_THRESHOLD:
            return None

        margin = max(0.0, best_score - second_score)
        confidence = int(round(min(1.0, margin / max(TYPE_CONFIDENCE_MARGIN_HIGH, 1e-6)) * 100))

        return {
            "type": best_type,
            "confidence": confidence,
        }

    def _fallback_vector(self, image: Image.Image) -> np.ndarray:
        image = _preprocess_for_embedding(image)
        resized_rgb = image.convert("RGB").resize((64, 64), RESAMPLE)
        rgb_array = np.asarray(resized_rgb, dtype=np.float32) / 255.0

        resized_gray = image.convert("L").resize((64, 64), RESAMPLE)
        gray_array = np.asarray(resized_gray, dtype=np.float32) / 255.0

        histogram_parts: List[np.ndarray] = []
        for channel_index in range(3):
            channel_histogram, _ = np.histogram(
                rgb_array[:, :, channel_index],
                bins=16,
                range=(0.0, 1.0),
                density=True,
            )
            histogram_parts.append(channel_histogram.astype(np.float32))

        gray_histogram, _ = np.histogram(
            gray_array,
            bins=16,
            range=(0.0, 1.0),
            density=True,
        )

        brightness = float(rgb_array.mean())
        contrast = float(rgb_array.std())
        aspect_ratio = float(rgb_array.shape[1] / max(rgb_array.shape[0], 1))

        vector = np.concatenate(
            histogram_parts
            + [
                gray_histogram.astype(np.float32),
                np.array([
                    brightness,
                    contrast,
                    float(gray_array.mean()),
                    float(gray_array.std()),
                    aspect_ratio,
                ], dtype=np.float32),
            ]
        )
        return _normalize_vector(vector)

    def score_to_similarity(self, score: float) -> int:
        if self.engine_name() == "histogram-fallback":
            normalized = max(0.0, min(1.0, score))
        else:
            if self._model_family == "gr_lite":
                default_low = 0.45
                default_high = 0.85
            else:
                default_low = 0.55
                default_high = 1.0

            low = float(os.getenv("AI_SCORE_LOW", str(default_low)))
            high = float(os.getenv("AI_SCORE_HIGH", str(default_high)))
            if high <= low:
                low = default_low
                high = default_high
            normalized = (score - low) / (high - low)
            normalized = max(0.0, min(1.0, normalized))

        percentage = int(round(normalized * 100))
        if self.engine_name() != "histogram-fallback":
            exact_match_score = float(os.getenv("AI_EXACT_MATCH_SCORE", "0.9995"))
            if percentage >= 100 and score < exact_match_score:
                return 99
        return percentage

    def search(self, query_image: Image.Image, catalog: List[Dict[str, Any]], limit: int) -> Dict[str, Any]:
        limit = max(1, min(int(limit or DEFAULT_LIMIT), MAX_LIMIT))
        engine_name = self.engine_name()
        clip_ready = self._ensure_clip()
        if clip_ready:
            query_vector = self._encode_clip_image(query_image)
        else:
            query_vector = self._fallback_vector(query_image)

        predicted_type: Optional[str] = None
        type_confidence: Optional[int] = None
        filtered_by_type = False

        if clip_ready:
            type_prediction = self._predict_type_from_clip(query_vector)
            if type_prediction:
                predicted_type = type_prediction["type"]
                type_confidence = type_prediction["confidence"]

        working_catalog = catalog
        if predicted_type and type_confidence is not None and type_confidence >= TYPE_FILTER_MIN_CONFIDENCE:
            filtered_catalog = [
                product for product in catalog
                if _extract_product_type(product) == predicted_type
            ]
            if filtered_catalog:
                working_catalog = filtered_catalog
                filtered_by_type = True

        candidates: List[Dict[str, Any]] = []
        vectors: List[np.ndarray] = []

        for product in working_catalog:
            if not isinstance(product, dict):
                continue

            image_urls = _extract_image_urls(product)
            if not image_urls:
                continue

            best_vector = None
            best_image_url = None
            best_score = None

            for image_url in image_urls:
                try:
                    vector = np.asarray(_cached_image_vector(image_url, engine_name, _index_config_key()), dtype=np.float32)
                except Exception:
                    continue

                score = float(vector @ query_vector)
                if best_score is None or score > best_score:
                    best_score = score
                    best_vector = vector
                    best_image_url = image_url

            if best_vector is None or best_image_url is None:
                continue

            candidates.append({
                "product": product,
                "image_url": best_image_url,
            })
            vectors.append(best_vector)

        if not candidates:
            return {
                "model": engine_name,
                "catalogSize": len(catalog),
                "predictedType": predicted_type,
                "typeConfidence": type_confidence,
                "filteredByType": filtered_by_type,
                "results": [],
                **_no_result_fields([]),
            }

        matrix = np.stack(vectors).astype(np.float32)
        query_matrix = query_vector.reshape(1, -1).astype(np.float32)

        if engine_name.endswith("-faiss") and faiss is not None:
            faiss.normalize_L2(matrix)
            faiss.normalize_L2(query_matrix)
            index = faiss.IndexFlatIP(matrix.shape[1])
            index.add(matrix)
            scores, indices = index.search(query_matrix, len(candidates))
            scores = scores[0]
            indices = indices[0]
        else:
            scores = matrix @ query_matrix.T
            scores = scores.reshape(-1)
            indices = np.argsort(scores)[::-1]

        best_by_product: Dict[int, Dict[str, Any]] = {}
        ordered_entries: List[Dict[str, Any]] = []
        for rank, candidate_index in enumerate(indices):
            candidate = candidates[int(candidate_index)]
            product = candidate["product"]
            product_id = _to_int(product.get("id"))
            if product_id is None:
                continue

            score = float(scores[rank])
            existing = best_by_product.get(product_id)
            if existing is None or score > existing["score"]:
                best_by_product[product_id] = {
                    "product": product,
                    "image_url": candidate["image_url"],
                    "score": score,
                }

        ordered_entries = sorted(
            best_by_product.values(),
            key=lambda item: item["score"],
            reverse=True,
        )

        results: List[Dict[str, Any]] = []
        for entry in ordered_entries:
            product = entry["product"]
            score = float(entry["score"])
            similarity = self.score_to_similarity(score)
            if similarity >= 100 and results:
                similarity = 99
            if similarity < MIN_RESULT_SIMILARITY:
                continue

            category = product.get("category")
            category_name = _extract_text_value(category)

            results.append({
                "id": _to_int(product.get("id")),
                "name": _extract_text_value(product.get("name")) or "Sản phẩm",
                "price": _to_float(product.get("price")),
                "originalPrice": _to_float(product.get("originalPrice") or product.get("original_price")),
                "image": entry["image_url"],
                "similarity": similarity,
                "type": _extract_text_value(product.get("type")),
                "category": category_name,
                "tag": _extract_text_value(product.get("tag")),
            })
            if len(results) >= limit:
                break

        if not filtered_by_type and predicted_type is None:
            inferred = _infer_type_from_results(results)
            if inferred:
                predicted_type = inferred["type"]
                type_confidence = inferred.get("confidence")

        return {
            "model": engine_name,
            "catalogSize": len(catalog),
            "predictedType": predicted_type,
            "typeConfidence": type_confidence,
            "filteredByType": filtered_by_type,
            "results": results,
            **_no_result_fields(results),
        }


@dataclass(frozen=True)
class CatalogIndexSnapshot:
    engine_name: str
    catalog_size: int
    entries: tuple
    matrix: Optional[np.ndarray]
    faiss_index: Optional[Any]
    type_index: Dict[str, tuple]


class CatalogIndex:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: tuple = tuple()
        self._matrix: Optional[np.ndarray] = None
        self._faiss_index = None
        self._type_index: Dict[str, tuple] = {}
        self._engine_name = ""
        self._catalog_size = 0
        self._built_at = 0.0
        self._last_error: Optional[str] = None
        self._load_local_index()

    def _load_local_index(self) -> bool:
        if not os.path.exists(METADATA_PATH):
            return False

        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                meta = json.load(f)

            if meta.get("engine_name") != engine.engine_name():
                return False
            if meta.get("index_config_key") != _index_config_key():
                return False

            self._entries = tuple(meta.get("entries", []))
            self._catalog_size = meta.get("catalog_size", 0)
            self._built_at = meta.get("built_at", 0.0)
            self._engine_name = meta.get("engine_name", "")

            type_index = {}
            for k, v in meta.get("type_index", {}).items():
                type_index[k] = tuple(v)
            self._type_index = type_index

            if os.path.exists(NUMPY_INDEX_PATH):
                self._matrix = np.load(NUMPY_INDEX_PATH)

            if self._matrix is not None and len(self._matrix) != len(self._entries):
                self._last_error = "Local index matrix does not match metadata entries"
                self._entries = tuple()
                self._matrix = None
                return False

            if self._engine_name.endswith("-faiss") and faiss is not None:
                if os.path.exists(FAISS_INDEX_PATH):
                    self._faiss_index = faiss.read_index(FAISS_INDEX_PATH)
                    if getattr(self._faiss_index, "ntotal", len(self._entries)) != len(self._entries):
                        self._last_error = "Local FAISS index does not match metadata entries"
                        self._entries = tuple()
                        self._faiss_index = None
                        self._matrix = None
                        return False
                else:
                    if self._matrix is None:
                        return False
            else:
                if self._matrix is None:
                    return False

            return True
        except Exception as e:
            self._last_error = f"Load local index error: {str(e)}"
            return False

    def _save_local_index(self) -> None:
        try:
            if not os.path.exists(DATA_DIR):
                os.makedirs(DATA_DIR, exist_ok=True)

            # Save metadata
            meta = {
                "engine_name": self._engine_name,
                "index_config_key": _index_config_key(),
                "catalog_size": self._catalog_size,
                "built_at": self._built_at,
                "entries": list(self._entries),
                "type_index": {k: list(v) for k, v in self._type_index.items()}
            }
            with open(METADATA_PATH, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)

            # Save vector data
            if self._matrix is not None:
                np.save(NUMPY_INDEX_PATH, self._matrix)

            if self._faiss_index is not None and faiss is not None:
                faiss.write_index(self._faiss_index, FAISS_INDEX_PATH)
        except Exception as e:
            self._last_error = f"Save local index error: {str(e)}"

    def _is_fresh(self, engine_name: str) -> bool:
        if not self._entries or self._engine_name != engine_name:
            return False
        if self._matrix is None and self._faiss_index is None:
            return False
        if INDEX_TTL_SECONDS <= 0:
            return True
        return (time.monotonic() - self._built_at) < INDEX_TTL_SECONDS

    def _snapshot(self) -> CatalogIndexSnapshot:
        return CatalogIndexSnapshot(
            engine_name=self._engine_name,
            catalog_size=self._catalog_size,
            entries=self._entries,
            matrix=self._matrix,
            faiss_index=self._faiss_index,
            type_index=self._type_index,
        )

    def _build_index(self, engine_name: str, catalog: List[Dict[str, Any]]) -> None:
        entries: List[Dict[str, Any]] = []
        vectors: List[np.ndarray] = []

        max_images = INDEX_MAX_IMAGES_PER_PRODUCT
        for product in catalog:
            if not isinstance(product, dict):
                continue

            image_urls = _extract_image_urls(product)
            if not image_urls:
                continue

            if max_images > 0:
                image_urls = image_urls[:max_images]

            product_type = _extract_product_type(product)
            for image_url in image_urls:
                try:
                    vector = np.asarray(_cached_image_vector(image_url, engine_name, _index_config_key()), dtype=np.float32)
                except Exception:
                    continue

                # prepare a short text descriptor for the product to allow cross-modal re-ranking
                text_parts: List[str] = []
                name = _extract_text_value(product.get("name"))
                if name:
                    text_parts.append(name)
                ptype = _extract_text_value(product.get("type"))
                if ptype:
                    text_parts.append(ptype)
                tag = _extract_text_value(product.get("tag"))
                if tag:
                    text_parts.append(tag)
                desc = _extract_text_value(product.get("description"))
                if desc:
                    text_parts.append(desc)

                text_descriptor = " ".join(text_parts).strip() or str(product.get("id", ""))
                text_vector = None
                try:
                    tv = engine.encode_text(text_descriptor)
                    if tv is not None:
                        text_vector = tuple(tv.tolist())
                except Exception:
                    text_vector = None

                entries.append({
                    "product": product,
                    "image_url": image_url,
                    "type": product_type,
                    "text_vector": text_vector,
                })
                vectors.append(vector)

        matrix: Optional[np.ndarray] = None
        faiss_index = None

        if vectors:
            matrix = np.stack(vectors).astype(np.float32)
            if engine_name.endswith("-faiss") and faiss is not None:
                faiss.normalize_L2(matrix)
                faiss_index = faiss.IndexFlatIP(matrix.shape[1])
                faiss_index.add(matrix)

        type_index: Dict[str, List[int]] = {}
        for index, entry in enumerate(entries):
            entry_type = entry.get("type")
            if entry_type:
                type_index.setdefault(entry_type, []).append(index)

        self._entries = tuple(entries)
        self._matrix = matrix
        self._faiss_index = faiss_index
        self._type_index = {key: tuple(value) for key, value in type_index.items()}
        self._engine_name = engine_name
        self._catalog_size = len(catalog)
        self._built_at = time.monotonic()
        self._last_error = None
        self._save_local_index()

    def get_snapshot(self, engine: VisualSearchEngine, force_refresh: bool = False) -> CatalogIndexSnapshot:
        engine_name = engine.engine_name()
        if not force_refresh and self._is_fresh(engine_name):
            return self._snapshot()

        with self._lock:
            if not force_refresh and self._is_fresh(engine_name):
                return self._snapshot()

            try:
                # Try loading local if not forcing refresh
                if not force_refresh and not self._entries:
                    if self._load_local_index():
                        return self._snapshot()

                catalog = _fetch_catalog()
                self._build_index(engine_name, catalog)
            except Exception as exception:
                self._last_error = str(exception)
                if self._entries:
                    return self._snapshot()
                raise

            return self._snapshot()

    def search(
        self,
        engine: VisualSearchEngine,
        query_image: Image.Image,
        limit: int,
        snapshot: CatalogIndexSnapshot,
        preferred_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        limit = max(1, min(int(limit or DEFAULT_LIMIT), MAX_LIMIT))
        engine_name = snapshot.engine_name or engine.engine_name()

        requested_type = _normalize_type(preferred_type) if preferred_type else None

        clip_ready = engine._ensure_clip()
        if clip_ready:
            query_vector = engine._encode_clip_image(query_image)
        else:
            query_vector = engine._fallback_vector(query_image)

        query_vector = np.asarray(query_vector, dtype=np.float32).reshape(-1)

        predicted_type: Optional[str] = None
        type_confidence: Optional[int] = None
        filtered_by_type = False

        if requested_type:
            predicted_type = requested_type
            filtered_by_type = True
        elif clip_ready:
            type_prediction = engine._predict_type_from_clip(query_vector)
            if type_prediction:
                predicted_type = type_prediction["type"]
                type_confidence = type_prediction["confidence"]

        entries = snapshot.entries
        matrix = snapshot.matrix
        has_faiss_index = (
            snapshot.faiss_index is not None
            and snapshot.engine_name.endswith("-faiss")
            and faiss is not None
        )

        if not entries or (matrix is None and not has_faiss_index):
            return {
                "model": engine_name,
                "catalogSize": snapshot.catalog_size,
                "predictedType": predicted_type,
                "typeConfidence": type_confidence,
                "filteredByType": filtered_by_type,
                "results": [],
                **_no_result_fields([]),
            }

        scores: np.ndarray
        indices: np.ndarray
        auto_filter_type = (
            predicted_type
            if (
                predicted_type
                and type_confidence is not None
                and type_confidence >= TYPE_FILTER_MIN_CONFIDENCE
            )
            else None
        )
        active_filter_type = requested_type or auto_filter_type

        if active_filter_type:
            type_indices = snapshot.type_index.get(active_filter_type)
            if not type_indices:
                if requested_type:
                    return {
                        "model": engine_name,
                        "catalogSize": snapshot.catalog_size,
                        "predictedType": predicted_type,
                        "typeConfidence": type_confidence,
                        "filteredByType": filtered_by_type,
                        "results": [],
                        **_no_result_fields([]),
                    }

                scores, indices = self._rank_all(snapshot, query_vector, limit)
                filtered_by_type = False
            elif matrix is not None:
                filtered_by_type = True
                type_array = np.asarray(type_indices, dtype=np.int64)
                subset_matrix = matrix[type_array]
                subset_scores = subset_matrix @ query_vector
                order = np.argsort(subset_scores)[::-1]
                scores = subset_scores[order]
                indices = type_array[order]
            else:
                all_scores, all_indices = self._rank_all(snapshot, query_vector, len(entries))
                allowed_indices = set(type_indices)
                filtered_pairs = [
                    (float(score), int(index))
                    for score, index in zip(all_scores, all_indices)
                    if int(index) in allowed_indices
                ]

                if filtered_pairs:
                    filtered_by_type = True
                    scores = np.asarray([score for score, _ in filtered_pairs], dtype=np.float32)
                    indices = np.asarray([index for _, index in filtered_pairs], dtype=np.int64)
                elif requested_type:
                    return {
                        "model": engine_name,
                        "catalogSize": snapshot.catalog_size,
                        "predictedType": predicted_type,
                        "typeConfidence": type_confidence,
                        "filteredByType": filtered_by_type,
                        "results": [],
                        **_no_result_fields([]),
                    }
                else:
                    scores, indices = self._rank_all(snapshot, query_vector, limit)
                    filtered_by_type = False
        else:
            scores, indices = self._rank_all(snapshot, query_vector, limit)

        best_by_product: Dict[int, Dict[str, Any]] = {}
        for rank, candidate_index in enumerate(indices):
            entry = entries[int(candidate_index)]
            product = entry.get("product")
            if not isinstance(product, dict):
                continue

            product_id = _to_int(product.get("id"))
            if product_id is None:
                continue

            score = float(scores[rank])
            existing = best_by_product.get(product_id)
            if existing is None or score > existing["score"]:
                best_by_product[product_id] = {
                    "product": product,
                    "image_url": entry.get("image_url"),
                    "score": score,
                }

        ordered_entries = sorted(
            best_by_product.values(),
            key=lambda item: item["score"],
            reverse=True,
        )

        if not requested_type and not filtered_by_type:
            type_window_size = max(limit * 2, TYPE_FALLBACK_MIN_MATCHES)
            inferred_type = _infer_type_from_ranked_entries(ordered_entries[:type_window_size])
            if inferred_type:
                inferred_confidence = int(inferred_type.get("confidence") or 0)
                if inferred_confidence >= int(round(TYPE_FALLBACK_RATIO * 100)):
                    inferred_name = inferred_type["type"]
                    same_type_entries = [
                        entry for entry in ordered_entries
                        if _extract_product_type(entry.get("product")) == inferred_name
                    ]
                    if same_type_entries:
                        ordered_entries = same_type_entries
                        predicted_type = inferred_name
                        type_confidence = inferred_confidence
                        filtered_by_type = True

        # Rerank with metadata (type mismatch correction)
        if (
            predicted_type
            and not filtered_by_type
            and type_confidence is not None
            and type_confidence >= TYPE_FILTER_MIN_CONFIDENCE
        ):
            for entry in ordered_entries:
                p = entry["product"]
                ptype = _extract_product_type(p)
                # If product type doesn't match predicted type, penalize slightly
                if ptype and ptype != predicted_type:
                    entry["score"] *= 0.50

            # Sort again after penalty
            ordered_entries.sort(key=lambda item: item["score"], reverse=True)

        results: List[Dict[str, Any]] = []
        for entry in ordered_entries:
            product = entry["product"]
            score = float(entry["score"])
            similarity = engine.score_to_similarity(score)
            if similarity >= 100 and results:
                similarity = 99
            if similarity < MIN_RESULT_SIMILARITY:
                continue

            category = product.get("category")
            category_name = _extract_text_value(category)

            results.append({
                "id": _to_int(product.get("id")),
                "name": _extract_text_value(product.get("name")) or "Sản phẩm",
                "price": _to_float(product.get("price")),
                "originalPrice": _to_float(product.get("originalPrice") or product.get("original_price")),
                "image": entry.get("image_url"),
                "similarity": similarity,
                "type": _extract_text_value(product.get("type")) or entry.get("type"),
                "category": category_name,
                "tag": _extract_text_value(product.get("tag")),
            })
            if len(results) >= limit:
                break

        if not filtered_by_type and predicted_type is None:
            inferred = _infer_type_from_results(results)
            if inferred:
                predicted_type = inferred["type"]
                type_confidence = inferred.get("confidence")

        return {
            "model": engine_name,
            "catalogSize": snapshot.catalog_size,
            "predictedType": predicted_type,
            "typeConfidence": type_confidence,
            "filteredByType": filtered_by_type,
            "results": results,
            **_no_result_fields(results),
        }

    def _rank_all(self, snapshot: CatalogIndexSnapshot, query_vector: np.ndarray, limit: int) -> tuple:
        entries = snapshot.entries
        matrix = snapshot.matrix
        has_faiss_index = (
            snapshot.faiss_index is not None
            and snapshot.engine_name.endswith("-faiss")
            and faiss is not None
        )
        if not entries or (matrix is None and not has_faiss_index):
            return np.array([]), np.array([])
        # If FAISS index available, retrieve top candidate_k then re-rank with optional text similarity
        if has_faiss_index:
            candidate_k = min(
                len(entries),
                max(limit * INDEX_CANDIDATE_MULTIPLIER, INDEX_CANDIDATE_MIN),
            )
            query_matrix = query_vector.reshape(1, -1).astype(np.float32)
            faiss.normalize_L2(query_matrix)
            scores, indices = snapshot.faiss_index.search(query_matrix, candidate_k)
            scores = scores[0].astype(np.float32)
            indices = indices[0].astype(np.int64)
            valid_mask = indices >= 0
            scores = scores[valid_mask]
            indices = indices[valid_mask]

            # compute optional text similarity for candidates
            text_scores = np.zeros_like(scores, dtype=np.float32)
            for i, idx in enumerate(indices):
                entry = entries[int(idx)]
                tv = entry.get("text_vector")
                if tv is not None:
                    try:
                        tv_arr = np.asarray(tv, dtype=np.float32)
                        # cross-modal similarity: text_vector dot image_query_vector
                        text_scores[i] = float(tv_arr @ query_vector)
                    except Exception:
                        text_scores[i] = 0.0

            if np.any(text_scores):
                combined = (1.0 - TEXT_SIMILARITY_WEIGHT) * scores + TEXT_SIMILARITY_WEIGHT * text_scores
            else:
                combined = scores

            order = np.argsort(combined)[::-1]
            return combined[order], indices[order]

        # Fallback: compute scores across all entries and optionally combine with text vectors
        if matrix is None:
            return np.array([]), np.array([])

        scores = matrix @ query_vector
        scores = scores.reshape(-1).astype(np.float32)

        # compute text scores if available
        text_scores = np.zeros_like(scores, dtype=np.float32)
        any_text = False
        for i, entry in enumerate(entries):
            tv = entry.get("text_vector")
            if tv is not None:
                any_text = True
                try:
                    tv_arr = np.asarray(tv, dtype=np.float32)
                    text_scores[i] = float(tv_arr @ query_vector)
                except Exception:
                    text_scores[i] = 0.0

        if any_text:
            combined = (1.0 - TEXT_SIMILARITY_WEIGHT) * scores + TEXT_SIMILARITY_WEIGHT * text_scores
        else:
            combined = scores

        indices = np.argsort(combined)[::-1]
        return combined[indices], indices

    def status(self) -> Dict[str, Any]:
        if not self._entries:
            age_seconds = None
        else:
            age_seconds = int(time.monotonic() - self._built_at)

        return {
            "ready": bool(self._entries),
            "engine": self._engine_name or None,
            "modelId": VISION_MODEL_NAME,
            "modelFamily": engine._model_family,
            "catalogSize": self._catalog_size,
            "entryCount": len(self._entries),
            "matrixReady": self._matrix is not None,
            "faissReady": self._faiss_index is not None,
            "ageSeconds": age_seconds,
            "minSimilarity": MIN_RESULT_SIMILARITY,
            "foregroundCrop": ENABLE_FOREGROUND_CROP,
            "segmentation": ENABLE_SEGMENTATION,
            "segmentationMode": SEGMENTATION_MODE,
            "segmentationModel": SEGMENTATION_MODEL,
            "lastError": self._last_error,
        }


engine = VisualSearchEngine()
catalog_index = CatalogIndex()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "model": engine.engine_name(),
        "modelId": VISION_MODEL_NAME,
        "modelFamily": engine._model_family,
        "catalogUrl": CATALOG_URL,
        "minSimilarity": MIN_RESULT_SIMILARITY,
        "foregroundCrop": ENABLE_FOREGROUND_CROP,
        "segmentation": ENABLE_SEGMENTATION,
        "segmentationMode": SEGMENTATION_MODE,
        "segmentationModel": SEGMENTATION_MODEL,
        "clipError": engine._clip_error,
    }


@app.get("/index/status")
def index_status() -> Dict[str, Any]:
    return catalog_index.status()


@app.post("/index/refresh")
def index_refresh() -> Dict[str, Any]:
    try:
        catalog_index.get_snapshot(engine, force_refresh=True)
    except Exception as exception:
        raise HTTPException(status_code=502, detail="Không thể làm mới chỉ mục tìm kiếm") from exception
    return catalog_index.status()


@app.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = DEFAULT_LIMIT,
    type: Optional[str] = None,
) -> Dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ tệp hình ảnh")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Tệp ảnh trống")

    try:
        # Step 6: Image pre-processing
        query_image = _load_image_from_bytes(image_bytes)
        # Limit size
        if query_image.width < 224 or query_image.height < 224:
            raise HTTPException(status_code=400, detail="Ảnh quá mờ hoặc quá nhỏ, vui lòng chọn ảnh rõ hơn (tối thiểu 224x224)")
        query_image.thumbnail((1024, 1024))
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(status_code=400, detail="Không thể đọc ảnh đã tải lên") from exception

    try:
        snapshot = catalog_index.get_snapshot(engine)
    except Exception as exception:
        raise HTTPException(status_code=502, detail="Không thể tải danh mục sản phẩm từ backend") from exception

    return catalog_index.search(engine, query_image, limit, snapshot, preferred_type=type)
