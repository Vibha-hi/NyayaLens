# Local retrieval service

This service provides keyless, local hybrid precedent retrieval over imported Supreme Court and High Court PDFs, with a small bundled fallback corpus.

## Setup

```powershell
python -m venv services/retrieval/.venv
services/retrieval/.venv/Scripts/python -m pip install -r services/retrieval/requirements.txt
services/retrieval/.venv/Scripts/python services/retrieval/bootstrap_model.py
```

The bootstrap command downloads the public `BAAI/bge-small-en-v1.5` ONNX embedding model into the ignored local cache. No account or API key is required. Runtime service startup is offline-only; document embeddings are computed once and cached in SQLite.

## Import PDFs

Place PDFs below `data/incoming`, then run:

```powershell
services/retrieval/.venv/Scripts/python services/retrieval/ingest.py
```

The importer extracts metadata and passages, uses local OCR only when embedded text is unusable, writes the exact requested manifest to `data/processed/judgments.csv`, and writes review flags to `data/processed/ingestion_qa.csv`. Generated source material and indexes are excluded from Git.

## Run

```powershell
services/retrieval/.venv/Scripts/python -m uvicorn app.main:app --app-dir services/retrieval --host 127.0.0.1 --port 8001
```

In another terminal, run `npm run dev`. The TanStack server proxies validated search requests to the local service.

## Verify

```powershell
services/retrieval/.venv/Scripts/python -m unittest discover -s services/retrieval/tests -v
services/retrieval/.venv/Scripts/python services/retrieval/evaluate.py
```

Rankings are retrieval outputs, not legal-accuracy probabilities. Every result must be verified against its linked judgment. Rows marked `review_required` in the QA report remain searchable when their judgment text is sound, but their incomplete metadata should be reviewed before institutional use.
