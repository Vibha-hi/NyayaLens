"""Build the local search corpus from PDFs placed below data/incoming."""

from __future__ import annotations

import argparse
import json

from app.ingestion import (
    apply_ocr,
    build_outputs,
    discover_pdfs,
    extract_embedded_text,
    save_text_cache,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-ocr", action="store_true", help="Profile only; leave low-quality PDFs excluded")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    paths = discover_pdfs()
    if not paths:
        raise SystemExit("No PDFs found below data/incoming")
    print(f"Extracting embedded text from {len(paths)} PDFs...", flush=True)
    documents = extract_embedded_text(paths, workers=max(1, args.workers))
    low_quality = sum(document.quality < 0.42 or len(document.text) < 500 for document in documents)
    print(f"Embedded extraction complete; {low_quality} PDFs require OCR.", flush=True)
    if not args.skip_ocr:
        apply_ocr(documents)
    save_text_cache(documents)
    print(json.dumps(build_outputs(documents), indent=2), flush=True)


if __name__ == "__main__":
    main()
