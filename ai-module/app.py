from __future__ import annotations

import base64
import io
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
    from transformers import CLIPModel, CLIPProcessor  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    torch = None
    CLIPModel = None
    CLIPProcessor = None


CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8080/api/products")
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "http://localhost:8080")
HTTP_TIMEOUT_SECONDS = float(os.getenv("AI_HTTP_TIMEOUT_SECONDS", "12"))
DEFAULT_LIMIT = int(os.getenv("AI_SEARCH_DEFAULT_LIMIT", "5"))
MAX_LIMIT = int(os.getenv("AI_SEARCH_MAX_LIMIT", "12"))
TYPE_SCORE_THRESHOLD = float(os.getenv("AI_TYPE_SCORE_THRESHOLD", "0.2"))
TYPE_MARGIN_THRESHOLD = float(os.getenv("AI_TYPE_MARGIN_THRESHOLD", "0.02"))
TYPE_FALLBACK_MIN_MATCHES = int(os.getenv("AI_TYPE_FALLBACK_MIN_MATCHES", "3"))
TYPE_FALLBACK_RATIO = float(os.getenv("AI_TYPE_FALLBACK_RATIO", "0.6"))
TYPE_FILTER_MIN_CONFIDENCE = int(os.getenv("AI_TYPE_FILTER_MIN_CONFIDENCE", "75"))
INDEX_TTL_SECONDS = float(os.getenv("AI_INDEX_TTL_SECONDS", "180"))
INDEX_MAX_IMAGES_PER_PRODUCT = int(os.getenv("AI_INDEX_MAX_IMAGES_PER_PRODUCT", "4"))
INDEX_CANDIDATE_MULTIPLIER = int(os.getenv("AI_INDEX_CANDIDATE_MULTIPLIER", "6"))
INDEX_CANDIDATE_MIN = int(os.getenv("AI_INDEX_CANDIDATE_MIN", "24"))

TYPE_PROMPTS = {
    "Áo": [
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


def _load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


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
def _cached_image_vector(raw_url: str, engine_name: str) -> tuple:
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
        self._text_features: Optional[Dict[str, np.ndarray]] = None

    def _ensure_clip(self) -> bool:
        if self._clip_attempted:
            return self._clip_ready

        self._clip_attempted = True

        if torch is None or CLIPModel is None or CLIPProcessor is None:
            self._clip_error = "CLIP libraries are not installed"
            return False

        try:
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self._model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self._device)
            self._model.eval()
            self._clip_ready = True
            return True
        except Exception as exception:  # pragma: no cover - model download/runtime dependent
            self._clip_error = str(exception)
            self._clip_ready = False
            return False

    def engine_name(self) -> str:
        if self._ensure_clip():
            return "clip-faiss" if faiss is not None else "clip-numpy"
        return "histogram-fallback"

    def encode_image(self, image: Image.Image) -> np.ndarray:
        if self._ensure_clip():
            return self._encode_clip_image(image)

        return self._fallback_vector(image)

    def _encode_clip_image(self, image: Image.Image) -> np.ndarray:
        inputs = self._processor(images=image, return_tensors="pt")
        inputs = {key: value.to(self._device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = self._model.get_image_features(**inputs)
            features = outputs.pooler_output if hasattr(outputs, "pooler_output") else outputs
            features = torch.nn.functional.normalize(features, p=2, dim=-1)
        return features[0].detach().cpu().numpy().astype(np.float32)

    def _get_text_features(self) -> Optional[Dict[str, np.ndarray]]:
        if self._text_features is not None:
            return self._text_features

        if not self._ensure_clip():
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

        inputs = self._processor(text=prompts, return_tensors="pt", padding=True)
        inputs = {key: value.to(self._device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = self._model.get_text_features(**inputs)
            features = outputs.pooler_output if hasattr(outputs, "pooler_output") else outputs
            features = torch.nn.functional.normalize(features, p=2, dim=-1)

        vectors = features.detach().cpu().numpy().astype(np.float32)
        grouped: Dict[str, List[np.ndarray]] = {key: [] for key in TYPE_PROMPTS.keys()}
        for product_type, vector in zip(prompt_types, vectors):
            grouped.setdefault(product_type, []).append(vector)

        self._text_features = {
            product_type: np.stack(type_vectors)
            for product_type, type_vectors in grouped.items()
            if type_vectors
        }
        return self._text_features

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

        return {
            "type": best_type,
            "confidence": self.score_to_similarity(best_score),
        }

    def _fallback_vector(self, image: Image.Image) -> np.ndarray:
        resized_rgb = ImageOps.exif_transpose(image).convert("RGB").resize((64, 64), RESAMPLE)
        rgb_array = np.asarray(resized_rgb, dtype=np.float32) / 255.0

        resized_gray = ImageOps.exif_transpose(image).convert("L").resize((64, 64), RESAMPLE)
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
            normalized = max(0.0, min(1.0, (score + 1.0) / 2.0))

        return int(round(normalized * 100))

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
                    vector = np.asarray(_cached_image_vector(image_url, engine_name), dtype=np.float32)
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
            }

        matrix = np.stack(vectors).astype(np.float32)
        query_matrix = query_vector.reshape(1, -1).astype(np.float32)

        if engine_name == "clip-faiss" and faiss is not None:
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
        )[:limit]

        results: List[Dict[str, Any]] = []
        for entry in ordered_entries:
            product = entry["product"]
            score = float(entry["score"])

            category = product.get("category")
            category_name = _extract_text_value(category)

            results.append({
                "id": _to_int(product.get("id")),
                "name": _extract_text_value(product.get("name")) or "Sản phẩm",
                "price": _to_float(product.get("price")),
                "originalPrice": _to_float(product.get("originalPrice") or product.get("original_price")),
                "image": entry["image_url"],
                "similarity": self.score_to_similarity(score),
                "type": _extract_text_value(product.get("type")),
                "category": category_name,
                "tag": _extract_text_value(product.get("tag")),
            })

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

    def _is_fresh(self, engine_name: str) -> bool:
        if not self._entries or self._engine_name != engine_name:
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
                    vector = np.asarray(_cached_image_vector(image_url, engine_name), dtype=np.float32)
                except Exception:
                    continue

                entries.append({
                    "product": product,
                    "image_url": image_url,
                    "type": product_type,
                })
                vectors.append(vector)

        matrix: Optional[np.ndarray] = None
        faiss_index = None

        if vectors:
            matrix = np.stack(vectors).astype(np.float32)
            if engine_name == "clip-faiss" and faiss is not None:
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

    def get_snapshot(self, engine: VisualSearchEngine, force_refresh: bool = False) -> CatalogIndexSnapshot:
        engine_name = engine.engine_name()
        if not force_refresh and self._is_fresh(engine_name):
            return self._snapshot()

        with self._lock:
            if not force_refresh and self._is_fresh(engine_name):
                return self._snapshot()

            try:
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

        if not entries or matrix is None:
            return {
                "model": engine_name,
                "catalogSize": snapshot.catalog_size,
                "predictedType": predicted_type,
                "typeConfidence": type_confidence,
                "filteredByType": filtered_by_type,
                "results": [],
            }

        scores: np.ndarray
        indices: np.ndarray

        if requested_type:
            type_indices = snapshot.type_index.get(requested_type)
            if not type_indices:
                return {
                    "model": engine_name,
                    "catalogSize": snapshot.catalog_size,
                    "predictedType": predicted_type,
                    "typeConfidence": type_confidence,
                    "filteredByType": filtered_by_type,
                    "results": [],
                }

            type_array = np.asarray(type_indices, dtype=np.int64)
            subset_matrix = matrix[type_array]
            subset_scores = subset_matrix @ query_vector
            order = np.argsort(subset_scores)[::-1]
            scores = subset_scores[order]
            indices = type_array[order]
        elif predicted_type:
            type_indices = snapshot.type_index.get(predicted_type)
            if type_indices:
                filtered_by_type = True
                type_array = np.asarray(type_indices, dtype=np.int64)
                subset_matrix = matrix[type_array]
                subset_scores = subset_matrix @ query_vector
                order = np.argsort(subset_scores)[::-1]
                scores = subset_scores[order]
                indices = type_array[order]
            else:
                scores, indices = self._rank_all(snapshot, query_vector, limit)
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
        )[:limit]

        results: List[Dict[str, Any]] = []
        for entry in ordered_entries:
            product = entry["product"]
            score = float(entry["score"])

            category = product.get("category")
            category_name = _extract_text_value(category)

            results.append({
                "id": _to_int(product.get("id")),
                "name": _extract_text_value(product.get("name")) or "Sản phẩm",
                "price": _to_float(product.get("price")),
                "originalPrice": _to_float(product.get("originalPrice") or product.get("original_price")),
                "image": entry.get("image_url"),
                "similarity": engine.score_to_similarity(score),
                "type": _extract_text_value(product.get("type")) or entry.get("type"),
                "category": category_name,
                "tag": _extract_text_value(product.get("tag")),
            })

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
        }

    def _rank_all(self, snapshot: CatalogIndexSnapshot, query_vector: np.ndarray, limit: int) -> tuple:
        entries = snapshot.entries
        matrix = snapshot.matrix
        if matrix is None or not entries:
            return np.array([]), np.array([])

        if snapshot.faiss_index is not None and snapshot.engine_name == "clip-faiss":
            candidate_k = min(
                len(entries),
                max(limit * INDEX_CANDIDATE_MULTIPLIER, INDEX_CANDIDATE_MIN),
            )
            query_matrix = query_vector.reshape(1, -1).astype(np.float32)
            faiss.normalize_L2(query_matrix)
            scores, indices = snapshot.faiss_index.search(query_matrix, candidate_k)
            return scores[0], indices[0]

        scores = matrix @ query_vector
        indices = np.argsort(scores)[::-1]
        return scores, indices

    def status(self) -> Dict[str, Any]:
        if not self._entries:
            age_seconds = None
        else:
            age_seconds = int(time.monotonic() - self._built_at)

        return {
            "ready": bool(self._entries),
            "engine": self._engine_name or None,
            "catalogSize": self._catalog_size,
            "entryCount": len(self._entries),
            "ageSeconds": age_seconds,
            "lastError": self._last_error,
        }


engine = VisualSearchEngine()
catalog_index = CatalogIndex()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "model": engine.engine_name(),
        "catalogUrl": CATALOG_URL,
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
        query_image = _load_image_from_bytes(image_bytes)
    except Exception as exception:
        raise HTTPException(status_code=400, detail="Không thể đọc ảnh đã tải lên") from exception

    try:
        snapshot = catalog_index.get_snapshot(engine)
    except Exception as exception:
        raise HTTPException(status_code=502, detail="Không thể tải danh mục sản phẩm từ backend") from exception

    return catalog_index.search(engine, query_image, limit, snapshot, preferred_type=type)
