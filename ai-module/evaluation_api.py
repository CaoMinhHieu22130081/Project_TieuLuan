from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CONFIG = BASE_DIR / "evaluation" / "test_queries.json"
DEFAULT_GENERATED_CONFIG = BASE_DIR / "evaluation" / "catalog_queries.json"
DEFAULT_GENERATED_IMAGE_DIR = BASE_DIR / "evaluation" / "catalog_queries"
DEFAULT_EXTERNAL_CONFIG = BASE_DIR / "evaluation" / "external_queries.json"
DEFAULT_EXTERNAL_IMAGE_DIR = BASE_DIR / "evaluation" / "external_queries"

EXTERNAL_QUERY_TEMPLATES = {
    "Áo": [
        "tshirt,shirt,top,clothing",
        "tee,shirt,clothing",
        "polo,shirt,clothing",
        "sweatshirt,top,clothing",
        "hoodie,top,clothing",
    ],
    "Quần": [
        "pants,trousers,clothing",
        "jeans,pants,clothing",
        "shorts,pants,clothing",
        "joggers,pants,clothing",
        "cargo,pants,clothing",
    ],
}

FOLDER_TYPE_ALIASES = {
    "ao": "Áo",
    "áo": "Áo",
    "shirt": "Áo",
    "shirts": "Áo",
    "top": "Áo",
    "tops": "Áo",
    "quan": "Quần",
    "quần": "Quần",
    "pants": "Quần",
    "trousers": "Quần",
    "jeans": "Quần",
    "shorts": "Quần",
}

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}

session = requests.Session()
session.headers.update({"User-Agent": "UniqTee-AI-Evaluation/1.0"})

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _pct(value: int, total: int) -> str:
    if total <= 0:
        return "n/a"
    return f"{value / total * 100:.1f}%"


def _to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_id(value: Any) -> Optional[str]:
    integer_value = _to_int(value)
    if integer_value is not None:
        return str(integer_value)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _extract_text_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    if isinstance(value, dict):
        for key in ("name", "title", "type", "label"):
            text = _extract_text_value(value.get(key))
            if text:
                return text
    return None


def _extract_product_type(product: Dict[str, Any]) -> Optional[str]:
    direct = _extract_text_value(product.get("type"))
    if direct:
        return direct
    category = product.get("category")
    if isinstance(category, dict):
        return _extract_text_value(category.get("type"))
    return None


def _extract_image_urls(product: Dict[str, Any]) -> List[str]:
    candidates: List[Any] = []
    for key in ("image", "imageUrl", "image_url", "thumbnail", "thumbnailUrl"):
        if product.get(key):
            candidates.append(product.get(key))

    images = product.get("images") or []
    if isinstance(images, list):
        candidates.extend(images)

    urls: List[str] = []
    seen = set()
    for item in candidates:
        if isinstance(item, dict):
            raw = item.get("url") or item.get("src") or item.get("image") or item.get("imageUrl")
        else:
            raw = item
        if raw is None:
            continue
        text = str(raw).strip()
        if text and text not in seen:
            urls.append(text)
            seen.add(text)
    return urls


def _catalog_base_url(catalog_url: str) -> str:
    parsed = urlparse(catalog_url)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return "http://localhost:8080"


def _resolve_url(raw_url: str, base_url: str) -> str:
    if raw_url.startswith("data:"):
        return raw_url
    parsed = urlparse(raw_url)
    if parsed.scheme in {"http", "https"}:
        return raw_url
    if raw_url.startswith("//"):
        return "https:" + raw_url
    if raw_url.startswith("/"):
        return urljoin(base_url.rstrip("/") + "/", raw_url.lstrip("/"))
    return urljoin(base_url.rstrip("/") + "/", raw_url)


def _resolve_query_path(path_value: Any) -> Optional[Path]:
    if not path_value:
        return None
    path = Path(str(path_value))
    if path.is_absolute():
        return path
    return BASE_DIR / path


def _relative_to_base(path: Path) -> str:
    try:
        return path.relative_to(BASE_DIR).as_posix()
    except ValueError:
        return str(path)


def _load_cases(config_path: Path) -> List[Dict[str, Any]]:
    if not config_path.exists():
        return []
    data = json.loads(config_path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("cases") or []
    if not isinstance(data, list):
        raise ValueError(f"Evaluation config must contain a list: {config_path}")
    return [case for case in data if isinstance(case, dict)]


def _fetch_catalog(catalog_url: str) -> List[Dict[str, Any]]:
    response = session.get(catalog_url, timeout=30)
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict) and isinstance(data.get("content"), list):
        data = data.get("content")
    if not isinstance(data, list):
        return []
    return [product for product in data if isinstance(product, dict)]


def _safe_file_stem(value: Any) -> str:
    text = _normalize_id(value) or str(value or "unknown")
    text = re.sub(r"[^a-zA-Z0-9_-]+", "_", text).strip("_")
    return text or "unknown"


def _image_extension(url: str, content_type: str = "") -> str:
    content_type = content_type.lower().split(";", 1)[0].strip()
    if content_type == "image/png":
        return ".png"
    if content_type == "image/webp":
        return ".webp"
    if content_type in {"image/jpeg", "image/jpg"}:
        return ".jpg"

    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".jpg"


def _download_image(url: str) -> Tuple[bytes, str]:
    if url.startswith("data:"):
        header, encoded = url.split(",", 1)
        content_type = header[5:].split(";", 1)[0]
        return base64.b64decode(encoded), _image_extension(url, content_type)

    response = session.get(url, timeout=30)
    response.raise_for_status()
    return response.content, _image_extension(url, response.headers.get("Content-Type", ""))


def generate_cases_from_catalog(
    catalog_url: str,
    output_dir: Path,
    output_config: Path,
    max_cases: int,
) -> List[Dict[str, Any]]:
    catalog = _fetch_catalog(catalog_url)
    base_url = _catalog_base_url(catalog_url)
    output_dir.mkdir(parents=True, exist_ok=True)

    cases: List[Dict[str, Any]] = []
    for product in catalog:
        if max_cases > 0 and len(cases) >= max_cases:
            break

        product_id = _to_int(product.get("id"))
        if product_id is None:
            continue

        image_urls = _extract_image_urls(product)
        if not image_urls:
            continue

        resolved_url = _resolve_url(image_urls[0], base_url)
        try:
            content, extension = _download_image(resolved_url)
        except requests.RequestException as exception:
            print(f"Skip product {product_id}: image download failed: {exception}")
            continue
        except ValueError as exception:
            print(f"Skip product {product_id}: invalid data URL: {exception}")
            continue

        image_path = output_dir / f"product_{_safe_file_stem(product_id)}{extension}"
        image_path.write_bytes(content)

        case = {
            "query_image_path": _relative_to_base(image_path),
            "expected_product_id": product_id,
        }
        product_type = _extract_product_type(product)
        if product_type:
            case["expected_type"] = product_type
        cases.append(case)

    output_config.parent.mkdir(parents=True, exist_ok=True)
    output_config.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")
    return cases


def generate_external_cases(
    output_dir: Path,
    output_config: Path,
    count_per_type: int,
    start_lock: int,
) -> List[Dict[str, Any]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    cases: List[Dict[str, Any]] = []

    for product_type, queries in EXTERNAL_QUERY_TEMPLATES.items():
        for index in range(max(0, count_per_type)):
            query = queries[index % len(queries)]
            lock = start_lock + len(cases)
            url = f"https://loremflickr.com/640/800/{query}?lock={lock}"
            image_path = output_dir / f"{'ao' if product_type == 'Áo' else 'quan'}_{index + 1:02d}.jpg"

            try:
                content, _extension = _download_image(url)
            except requests.RequestException as exception:
                print(f"Skip external {product_type} #{index + 1}: image download failed: {exception}")
                continue

            image_path.write_bytes(content)
            cases.append(
                {
                    "query_image_path": _relative_to_base(image_path),
                    "expected_type": product_type,
                    "source": url,
                    "note": "Auto-downloaded public image. Review manually before using as final benchmark.",
                }
            )

    output_config.parent.mkdir(parents=True, exist_ok=True)
    output_config.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")
    return cases


def generate_cases_from_folder(dataset_dir: Path, output_config: Path) -> List[Dict[str, Any]]:
    cases: List[Dict[str, Any]] = []
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Folder dataset not found: {dataset_dir}")

    for child in sorted(dataset_dir.iterdir()):
        if not child.is_dir():
            continue

        expected_type = FOLDER_TYPE_ALIASES.get(child.name.strip().lower())
        if not expected_type:
            print(f"Skip folder without known label: {child}")
            continue

        for image_path in sorted(child.rglob("*")):
            if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_SUFFIXES:
                continue
            cases.append(
                {
                    "query_image_path": _relative_to_base(image_path.resolve()),
                    "expected_type": expected_type,
                    "source": "manual-folder",
                }
            )

    output_config.parent.mkdir(parents=True, exist_ok=True)
    output_config.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")
    return cases


def call_image_search(base_url: str, image_path: Path, limit: int) -> Tuple[Dict[str, Any], float]:
    target_url = f"{base_url.rstrip('/')}/search/image"
    start_time = time.perf_counter()
    with image_path.open("rb") as image_file:
        response = session.post(
            target_url,
            params={"limit": limit},
            files={"file": (image_path.name, image_file, "image/jpeg")},
            timeout=90,
        )
    elapsed = time.perf_counter() - start_time
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("AI response must be a JSON object")
    return data, elapsed


def run_evaluation(cases: List[Dict[str, Any]], base_url: str, limit: int, generated: bool) -> None:
    if not cases:
        print("No evaluation cases found.")
        return

    cases_run = 0
    skipped = 0
    errors = 0
    id_cases = 0
    top1_hits = 0
    topk_hits = 0
    reciprocal_rank_total = 0.0
    type_cases = 0
    type_hits = 0
    no_result_count = 0
    total_latency = 0.0
    failures: List[Dict[str, Any]] = []

    print(f"Starting evaluation on {len(cases)} cases...")
    if generated:
        print("Mode: generated test set. Review labels manually before treating this as a final benchmark.")

    for case in cases:
        image_path = _resolve_query_path(case.get("query_image_path") or case.get("image_path"))
        expected_id = _normalize_id(case.get("expected_product_id"))
        expected_type = _extract_text_value(case.get("expected_type"))

        if not image_path or not image_path.exists():
            skipped += 1
            print(f"Skip: image not found: {image_path}")
            continue

        try:
            data, elapsed = call_image_search(base_url, image_path, limit)
        except (requests.RequestException, ValueError) as exception:
            errors += 1
            print(f"Error for {image_path}: {exception}")
            continue

        cases_run += 1
        total_latency += elapsed

        results = data.get("results")
        if not isinstance(results, list):
            results = []

        if data.get("noResult") is True or not results:
            no_result_count += 1

        predicted_type = _extract_text_value(data.get("predictedType"))
        if expected_type:
            type_cases += 1
            if predicted_type == expected_type:
                type_hits += 1

        found_ids = [_normalize_id(result.get("id")) for result in results if isinstance(result, dict)]
        found_ids = [found_id for found_id in found_ids if found_id]

        if expected_id:
            id_cases += 1
            rank = None
            for index, found_id in enumerate(found_ids[:limit], start=1):
                if found_id == expected_id:
                    rank = index
                    break

            if rank == 1:
                top1_hits += 1
            if rank is not None:
                topk_hits += 1
                reciprocal_rank_total += 1.0 / rank
            else:
                failures.append(
                    {
                        "image": _relative_to_base(image_path),
                        "expected_id": expected_id,
                        "top_ids": found_ids[:limit],
                        "predicted_type": predicted_type,
                        "no_result": bool(data.get("noResult")),
                        "reason": data.get("noResultReason"),
                    }
                )

    print("\n--- EVALUATION RESULTS ---")
    print(f"Cases run: {cases_run}/{len(cases)}")
    print(f"Skipped: {skipped}")
    print(f"Errors: {errors}")
    print(f"Top-1 Accuracy: {_pct(top1_hits, id_cases)} ({top1_hits}/{id_cases})")
    print(f"Top-{limit} Accuracy: {_pct(topk_hits, id_cases)} ({topk_hits}/{id_cases})")
    if id_cases > 0:
        print(f"MRR: {reciprocal_rank_total / id_cases:.3f}")
    else:
        print("MRR: n/a")
    print(f"Type Accuracy: {_pct(type_hits, type_cases)} ({type_hits}/{type_cases})")
    print(f"No-result count: {no_result_count}")
    if cases_run > 0:
        print(f"Avg Latency: {total_latency / cases_run:.3f}s")
    else:
        print("Avg Latency: n/a")

    if failures:
        print("\nFailed ID matches:")
        for failure in failures[:10]:
            print(
                f"- {failure['image']}: expected={failure['expected_id']}, "
                f"top={failure['top_ids']}, type={failure['predicted_type']}, "
                f"noResult={failure['no_result']}"
            )
        if len(failures) > 10:
            print(f"... and {len(failures) - 10} more")
    print("--------------------------\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate UniqTee AI visual search accuracy.")
    parser.add_argument("--base-url", default="http://localhost:8000", help="AI module base URL.")
    parser.add_argument("--catalog-url", default="http://localhost:8080/api/products", help="Spring product catalog URL.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Evaluation JSON config path.")
    parser.add_argument("--limit", type=int, default=5, help="Number of results to request.")
    parser.add_argument("--generate-from-catalog", action="store_true", help="Create a catalog self-test dataset first.")
    parser.add_argument("--max-cases", type=int, default=50, help="Max catalog products to turn into self-test cases.")
    parser.add_argument("--generated-config", default=str(DEFAULT_GENERATED_CONFIG), help="Output config for generated cases.")
    parser.add_argument("--generated-image-dir", default=str(DEFAULT_GENERATED_IMAGE_DIR), help="Directory for generated images.")
    parser.add_argument("--generate-external", action="store_true", help="Create an outside-catalog image test set first.")
    parser.add_argument("--external-count-per-type", type=int, default=30, help="External images to download for each type.")
    parser.add_argument("--external-config", default=str(DEFAULT_EXTERNAL_CONFIG), help="Output config for external cases.")
    parser.add_argument("--external-image-dir", default=str(DEFAULT_EXTERNAL_IMAGE_DIR), help="Directory for external images.")
    parser.add_argument("--external-start-lock", type=int, default=7000, help="Deterministic image seed for external downloads.")
    parser.add_argument("--generate-from-folder", action="store_true", help="Create a labeled test config from image folders.")
    parser.add_argument("--folder-dataset-dir", default=str(BASE_DIR / "evaluation" / "manual_external"), help="Folder with Áo/Quần or ao/quan subfolders.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    limit = max(1, int(args.limit or 5))

    if args.generate_from_catalog:
        generated_config = Path(args.generated_config)
        cases = generate_cases_from_catalog(
            args.catalog_url,
            Path(args.generated_image_dir),
            generated_config,
            max(0, int(args.max_cases or 0)),
        )
        print(f"Generated {len(cases)} cases at {generated_config}")
        run_evaluation(cases, args.base_url, limit, generated=True)
        return

    if args.generate_external:
        external_config = Path(args.external_config)
        cases = generate_external_cases(
            Path(args.external_image_dir),
            external_config,
            max(0, int(args.external_count_per_type or 0)),
            int(args.external_start_lock or 7000),
        )
        print(f"Generated {len(cases)} external cases at {external_config}")
        print("Expected IDs are intentionally omitted because these images are outside the catalog.")
        run_evaluation(cases, args.base_url, limit, generated=True)
        return

    if args.generate_from_folder:
        external_config = Path(args.external_config)
        cases = generate_cases_from_folder(Path(args.folder_dataset_dir), external_config)
        print(f"Generated {len(cases)} folder cases at {external_config}")
        run_evaluation(cases, args.base_url, limit, generated=True)
        return

    config_path = Path(args.config)
    cases = _load_cases(config_path)
    if not cases:
        print(f"Evaluation cancelled: {config_path} not found or empty.")
        print("Create evaluation/test_queries.json or run with --generate-from-catalog.")
        return

    run_evaluation(cases, args.base_url, limit, generated=False)


if __name__ == "__main__":
    main()
