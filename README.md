# Citizen Legal AI

A sober, source-linked precedent retrieval prototype for lawyers and judicial researchers. It combines local semantic embeddings with SQLite full-text search, then fuses both rankings with reciprocal-rank fusion (RRF). Search runs without a paid API or API key.

This remains a research prototype, not a comprehensive legal database or legal-advice system. The bundled corpus currently contains five selected Supreme Court bail decisions and ten manually reviewed passages. Every result links to the original judgment for human verification.

## Retrieval flow

1. The TanStack server validates the query and filters and proxies the request; the browser never receives service credentials.
2. The Python service embeds the query locally with `BAAI/bge-small-en-v1.5` through ONNX Runtime.
3. Dense cosine retrieval and SQLite FTS5 retrieval run over the same filtered corpus.
4. RRF combines the two candidate rankings and groups passages by case.
5. The API returns source locators, reason codes and retrieval traces—not predicted outcomes or invented relevance percentages.

## Local setup (Windows PowerShell)

Install the frontend:

```powershell
npm install
```

Create the retrieval environment and install its pinned dependencies:

```powershell
python -m venv services/retrieval/.venv
services/retrieval/.venv/Scripts/python.exe -m pip install -r services/retrieval/requirements.txt
```

Download the public embedding model once. This requires internet access but no account or API key. Runtime search is offline after this step.

```powershell
services/retrieval/.venv/Scripts/python.exe services/retrieval/bootstrap_model.py
```

Start the retrieval service:

```powershell
services/retrieval/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir services/retrieval --host 127.0.0.1 --port 8001
```

In a second terminal, start the website:

```powershell
npm run dev
```

The default service URL is `http://127.0.0.1:8001`. Copy `.env.example` to `.env.local` only when the URL or optional shared secret needs to change.

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
services/retrieval/.venv/Scripts/python.exe -m unittest discover -s services/retrieval/tests -v
services/retrieval/.venv/Scripts/python.exe services/retrieval/evaluate.py
```

The evaluation corpus is versioned in `services/retrieval/evaluation/golden_queries.json`. The report compares dense, lexical and hybrid rankings using MRR@10, Recall@10 and nDCG@10. Five queries are useful as a regression gate, but far too small to support a claim of legal accuracy.

## Configuration and security

- No Indian Kanoon token, hosted-embedding key or generative-model key is used.
- `RETRIEVAL_SERVICE_URL` is read only by the TanStack server.
- `RETRIEVAL_SERVICE_SECRET` is optional for local use and recommended when the retrieval service is remotely reachable.
- Queries are limited and validated at both the TypeScript and Python boundaries.
- The model cache, generated SQLite index, virtual environment and local environment files are excluded from Git.
- Submitted case descriptions may contain sensitive data; use anonymized facts and add authentication, encryption, retention controls and audit logging before any institutional deployment.

## Scaling path

SQLite and exact cosine search are appropriate for this small demonstrator. A production corpus should use a licensed and traceable ingestion pipeline, immutable source versions, paragraph-level citation checks, PostgreSQL/pgvector or an equivalent vector index, hybrid reranking, access controls and a lawyer-reviewed evaluation set. The detailed implementation and rollout plan is in [`docs/semantic-search-execution-plan.md`](docs/semantic-search-execution-plan.md).

## Lovable synchronization

This repository is connected to [Lovable](https://lovable.dev/projects/59548ad3-f32b-4a87-af08-1e4c9c4e3064). Keep pushed history linear and do not force-push or rewrite published commits.
