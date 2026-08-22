from __future__ import annotations

import os
from functools import lru_cache

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine import SemanticEngine
from .models import HealthResponse, SearchRequest, SearchResponse


app = FastAPI(
    title="Citizen Legal AI Retrieval Service",
    version="0.1.0",
    description="Keyless local hybrid retrieval over a source-linked evaluation corpus.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Retrieval-Secret"],
)


@lru_cache(maxsize=1)
def get_engine() -> SemanticEngine:
    return SemanticEngine()


def verify_service_secret(x_retrieval_secret: str | None = Header(default=None)) -> None:
    expected = os.getenv("RETRIEVAL_SERVICE_SECRET", "").strip()
    if expected and x_retrieval_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid retrieval service credential")


@app.get("/health", response_model=HealthResponse)
def health(engine: SemanticEngine = Depends(get_engine)) -> HealthResponse:
    return HealthResponse(
        status="ready",
        corpusVersion=engine.corpus_version,
        modelVersion=engine.model_version,
        caseCount=engine.case_count,
        chunkCount=engine.chunk_count,
    )


@app.post("/search", response_model=SearchResponse, dependencies=[Depends(verify_service_secret)])
def search(request: SearchRequest, engine: SemanticEngine = Depends(get_engine)) -> SearchResponse:
    return engine.search(request.query, request.filters, request.top_k)
