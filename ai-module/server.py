from __future__ import annotations

import cgi
import base64
import hashlib
import json
import math
import os
import threading
import urllib.error
import urllib.parse
import urllib.request
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Iterable, List, Optional, Tuple


HOST = os.getenv("AI_MODULE_HOST", "127.0.0.1")
PORT = int(os.getenv("AI_MODULE_PORT", "8000"))
CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8080/api/products")
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "http://localhost:8080")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("AI_HTTP_TIMEOUT_SECONDS", "12"))
DEFAULT_LIMIT = int(os.getenv("AI_SEARCH_DEFAULT_LIMIT", "6"))
MAX_LIMIT = int(os.getenv("AI_SEARCH_MAX_LIMIT", "12"))

USER_AGENT = "UniqTee-Visual-Search/1.0"
BYTES_VECTOR_SIZE = 256


def _normalize_limit(value: Any) -> int:
    try:
        limit = int(value)
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    return max(1, min(limit, MAX_LIMIT))


def _safe_json_dumps(payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def _resolve_url(raw_url: Any) -> Optional[str]:
    if not raw_url:
        return None

    url = str(raw_url).strip()
    if not url:
        return None

    parsed = urllib.parse.urlparse(url)
    if parsed.scheme in {"http", "https", "data"}:
        return url

    if url.startswith("//"):
        return "https:" + url

    if url.startswith("/"):
        return urllib.parse.urljoin(ASSET_BASE_URL.rstrip("/") + "/", url.lstrip("/"))

    return urllib.parse.urljoin(ASSET_BASE_URL.rstrip("/") + "/", url)


def _extract_text_value(value: Any) -> Optional[str]:
    if value is None:
        return None

    if isinstance(value, dict):
        for key in ("name", "title", "label"):
            nested = value.get(key)
            if nested:
                return str(nested)
        return None

    text = str(value).strip()
    return text or None


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


def _extract_image_url(product: Dict[str, Any]) -> Optional[str]:
    images = product.get("images") or []
    for image in images:
        if isinstance(image, dict):
            candidate = image.get("url") or image.get("src") or image.get("image")
        elif isinstance(image, str):
            candidate = image
        else:
            candidate = None

        resolved = _resolve_url(candidate)
        if resolved:
            return resolved

    for key in ("image", "imageUrl", "thumbnail", "thumbnailUrl"):
        resolved = _resolve_url(product.get(key))
        if resolved:
            return resolved

    return None


def _download_bytes(raw_url: str) -> bytes:
    if raw_url.startswith("data:"):
        header, encoded = raw_url.split(",", 1)
        return base64.b64decode(encoded)

    request = urllib.request.Request(raw_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return response.read()


def _byte_histogram(data: bytes) -> List[float]:
    counts = [0] * BYTES_VECTOR_SIZE
    for byte_value in data:
        counts[byte_value] += 1

    total = float(len(data)) or 1.0
    return [count / total for count in counts]


def _cosine_similarity(left: List[float], right: List[float]) -> float:
    dot_product = sum(l * r for l, r in zip(left, right))
    left_norm = math.sqrt(sum(l * l for l in left))
    right_norm = math.sqrt(sum(r * r for r in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot_product / (left_norm * right_norm)


@lru_cache(maxsize=256)
def _cached_download_bytes(raw_url: str) -> bytes:
    return _download_bytes(raw_url)


@lru_cache(maxsize=256)
def _cached_vector_for_url(raw_url: str) -> Tuple[float, ...]:
    try:
        data = _cached_download_bytes(raw_url)
    except Exception:
        data = raw_url.encode("utf-8")
    return tuple(_byte_histogram(data))


def _load_catalog() -> List[Dict[str, Any]]:
    request = urllib.request.Request(CATALOG_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if isinstance(payload, dict) and isinstance(payload.get("content"), list):
        return payload.get("content", [])
    if isinstance(payload, list):
        return payload
    return []


def _search_by_image(file_bytes: bytes, limit: int) -> Dict[str, Any]:
    catalog = _load_catalog()
    query_vector = _byte_histogram(file_bytes)

    scored_results: List[Dict[str, Any]] = []
    for product in catalog:
        if not isinstance(product, dict):
            continue

        image_url = _extract_image_url(product)
        if image_url:
            vector = list(_cached_vector_for_url(image_url))
        else:
            metadata = " ".join(
                value for value in [
                    _extract_text_value(product.get("name")),
                    _extract_text_value(product.get("type")),
                    _extract_text_value(product.get("tag")),
                    _extract_text_value(product.get("description")),
                ] if value
            )
            vector = _byte_histogram(metadata.encode("utf-8") if metadata else str(product.get("id", "")).encode("utf-8"))

        similarity_score = _cosine_similarity(query_vector, vector)
        category = product.get("category")
        category_name = _extract_text_value(category)

        scored_results.append({
            "id": _to_int(product.get("id")),
            "name": _extract_text_value(product.get("name")) or "Sản phẩm",
            "price": _to_float(product.get("price")),
            "originalPrice": _to_float(product.get("originalPrice") or product.get("original_price")),
            "image": image_url,
            "similarity": int(round(max(0.0, min(1.0, similarity_score)) * 100)),
            "type": _extract_text_value(product.get("type")),
            "category": category_name,
            "tag": _extract_text_value(product.get("tag")),
        })

    scored_results.sort(key=lambda item: (item["similarity"], item["id"] or 0), reverse=True)

    return {
        "model": "byte-histogram-fallback",
        "catalogSize": len(catalog),
        "results": scored_results[:limit],
    }


class AiModuleHandler(BaseHTTPRequestHandler):
    server_version = "UniqTeeVisualSearch/1.0"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return

    def _send_json(self, status_code: int, payload: Dict[str, Any]) -> None:
        body = _safe_json_dumps(payload)
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "model": "byte-histogram-fallback",
                    "catalogUrl": CATALOG_URL,
                },
            )
            return

        self._send_json(404, {"message": "Not found"})

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/search/image":
            self._send_json(404, {"message": "Not found"})
            return

        content_type = self.headers.get("content-type", "")
        environ = {
            "REQUEST_METHOD": "POST",
            "CONTENT_TYPE": content_type,
            "CONTENT_LENGTH": self.headers.get("content-length", "0"),
        }

        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ=environ, keep_blank_values=True)
        except Exception:
            self._send_json(400, {"message": "Không thể đọc dữ liệu upload"})
            return

        file_field = form["file"] if "file" in form else None
        if file_field is None or getattr(file_field, "file", None) is None:
            self._send_json(400, {"message": "Vui lòng tải lên một hình ảnh sản phẩm hợp lệ"})
            return

        try:
            file_bytes = file_field.file.read()
        except Exception:
            self._send_json(400, {"message": "Không thể đọc file ảnh đã tải lên"})
            return

        if not file_bytes:
            self._send_json(400, {"message": "Tệp ảnh trống"})
            return

        query_params = urllib.parse.parse_qs(parsed.query)
        limit = _normalize_limit(query_params.get("limit", [DEFAULT_LIMIT])[0])

        try:
            payload = _search_by_image(file_bytes, limit)
        except urllib.error.URLError:
            self._send_json(502, {"message": "Không thể tải danh mục sản phẩm từ backend"})
            return
        except Exception as exception:
            self._send_json(500, {"message": f"AI module error: {exception}"})
            return

        self._send_json(200, payload)


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), AiModuleHandler)
    print(f"AI module listening on http://{HOST}:{PORT}")
    print(f"Catalog source: {CATALOG_URL}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
