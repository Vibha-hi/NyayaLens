from __future__ import annotations

import hashlib
import json
import math
import re
import sqlite3
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Iterable

import numpy as np
from fastembed import TextEmbedding

from .models import EvidenceLocator, SearchFilters, SearchResponse, SearchResult


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "corpus" / "cases.json"
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "search.db"
MODEL_CACHE = DATA_DIR / "model-cache"
MODEL_NAME = "BAAI/bge-small-en-v1.5"
RRF_K = 60


@dataclass(frozen=True)
class RankedChunk:
    chunk_id: str
    rank: int


LEGAL_CONCEPTS: dict[str, tuple[str, ...]] = {
    "regular bail": ("regular bail", "release pending trial", "pre-trial release"),
    "anticipatory bail": ("anticipatory bail", "pre-arrest bail", "section 438"),
    "default bail": ("default bail", "statutory bail", "section 167", "charge sheet deadline"),
    "prolonged custody": ("prolonged custody", "long detention", "incarceration", "trial delay"),
    "documentary evidence": ("documentary evidence", "records", "documents", "paper trail"),
    "witness interference": ("witness interference", "tamper", "intimidation", "influence witnesses"),
    "flight risk": ("flight risk", "abscond", "flee", "appearance at trial"),
    "investigation complete": ("investigation complete", "charge sheet filed", "challan filed"),
    "personal liberty": ("personal liberty", "article 21", "liberty"),
    "economic offence": ("economic offence", "money laundering", "pmla", "financial fraud"),
}


def extract_signals(text: str) -> list[str]:
    lowered = text.lower()
    signals = [label.title() for label, variants in LEGAL_CONCEPTS.items() if any(v in lowered for v in variants)]
    sections = re.findall(r"\b(?:section|sec\.?)[\s-]*(\d+[a-z]?(?:\(\d+\))?)", lowered)
    signals.extend(f"Section {section.upper()}" for section in sections)
    return list(dict.fromkeys(signals))[:10]


def lexical_tokens(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    stop = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
        "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "were",
        "with", "where", "which", "after", "before", "seeks", "applicant", "case",
    }
    return [token for token in tokens if len(token) > 2 and token not in stop]


class SemanticEngine:
    def __init__(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        MODEL_CACHE.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        # Runtime search is deliberately offline: once the model has been installed,
        # service startup must never depend on a registry request or an API key.
        self._model = TextEmbedding(
            model_name=MODEL_NAME,
            cache_dir=str(MODEL_CACHE),
            threads=2,
            local_files_only=True,
        )
        self._corpus = self._load_corpus()
        self._cases = {case["id"]: case for case in self._corpus["cases"]}
        self._chunks = {
            chunk["id"]: {**chunk, "case_id": case["id"]}
            for case in self._corpus["cases"]
            for chunk in case["chunks"]
        }
        self._ensure_index()
        self._load_vectors()

    @property
    def corpus_version(self) -> str:
        return str(self._corpus["corpusVersion"])

    @property
    def model_version(self) -> str:
        return MODEL_NAME

    @property
    def case_count(self) -> int:
        return len(self._cases)

    @property
    def chunk_count(self) -> int:
        return len(self._chunks)

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        return connection

    def _load_corpus(self) -> dict[str, object]:
        return json.loads(CORPUS_PATH.read_text(encoding="utf-8"))

    def _corpus_hash(self) -> str:
        return hashlib.sha256(CORPUS_PATH.read_bytes()).hexdigest()

    def _ensure_index(self) -> None:
        with self._connect() as db:
            db.executescript(
                """
                CREATE TABLE IF NOT EXISTS index_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS chunks (
                    chunk_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL,
                    index_text TEXT NOT NULL,
                    embedding BLOB NOT NULL
                );
                CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                    chunk_id UNINDEXED,
                    case_id UNINDEXED,
                    index_text,
                    tokenize='porter unicode61'
                );
                """
            )
            current = db.execute("SELECT value FROM index_meta WHERE key='corpus_hash'").fetchone()
            if current and current["value"] == self._corpus_hash():
                return

            texts = [self._chunks[chunk_id]["indexText"] for chunk_id in self._chunks]
            embeddings = list(self._model.embed(texts))
            if len(embeddings) != len(texts):
                raise RuntimeError("Embedding model returned an unexpected vector count")

            db.execute("DELETE FROM chunks")
            db.execute("DELETE FROM chunks_fts")
            for (chunk_id, chunk), vector in zip(self._chunks.items(), embeddings, strict=True):
                normalized = self._normalize(np.asarray(vector, dtype=np.float32))
                db.execute(
                    "INSERT INTO chunks(chunk_id, case_id, index_text, embedding) VALUES (?, ?, ?, ?)",
                    (chunk_id, chunk["case_id"], chunk["indexText"], normalized.tobytes()),
                )
                db.execute(
                    "INSERT INTO chunks_fts(chunk_id, case_id, index_text) VALUES (?, ?, ?)",
                    (chunk_id, chunk["case_id"], chunk["indexText"]),
                )
            db.execute(
                "INSERT OR REPLACE INTO index_meta(key, value) VALUES ('corpus_hash', ?)",
                (self._corpus_hash(),),
            )
            db.execute(
                "INSERT OR REPLACE INTO index_meta(key, value) VALUES ('model_version', ?)",
                (MODEL_NAME,),
            )

    def _load_vectors(self) -> None:
        with self._connect() as db:
            rows = db.execute("SELECT chunk_id, embedding FROM chunks ORDER BY chunk_id").fetchall()
        self._vector_ids = [row["chunk_id"] for row in rows]
        self._vectors = np.stack([np.frombuffer(row["embedding"], dtype=np.float32) for row in rows])

    @staticmethod
    def _normalize(vector: np.ndarray) -> np.ndarray:
        norm = float(np.linalg.norm(vector))
        return vector if math.isclose(norm, 0.0) else vector / norm

    def _case_allowed(self, case_id: str, filters: SearchFilters) -> bool:
        case = self._cases[case_id]
        if filters.court != "All Courts" and case["court"] != filters.court:
            return False
        if filters.year != "All Years" and str(case["year"]) != filters.year:
            return False
        if filters.issue != "All Issues" and filters.issue not in case["legalIssues"]:
            return False
        return True

    def _dense(self, query: str, filters: SearchFilters, limit: int = 50) -> list[RankedChunk]:
        with self._lock:
            query_vector = next(iter(self._model.query_embed(query)))
        normalized = self._normalize(np.asarray(query_vector, dtype=np.float32))
        similarities = self._vectors @ normalized
        ordered = np.argsort(-similarities)
        results: list[RankedChunk] = []
        for index in ordered:
            chunk_id = self._vector_ids[int(index)]
            if self._case_allowed(self._chunks[chunk_id]["case_id"], filters):
                results.append(RankedChunk(chunk_id=chunk_id, rank=len(results) + 1))
            if len(results) >= limit:
                break
        return results

    def _lexical(self, query: str, filters: SearchFilters, limit: int = 50) -> list[RankedChunk]:
        tokens = lexical_tokens(query)
        if not tokens:
            return []
        fts_query = " OR ".join(f'"{token}"' for token in dict.fromkeys(tokens[:30]))
        with self._connect() as db:
            rows = db.execute(
                """
                SELECT chunk_id, case_id, bm25(chunks_fts) AS score
                FROM chunks_fts
                WHERE chunks_fts MATCH ?
                ORDER BY score ASC
                LIMIT ?
                """,
                (fts_query, max(limit * 3, 50)),
            ).fetchall()
        results: list[RankedChunk] = []
        for row in rows:
            if self._case_allowed(row["case_id"], filters):
                results.append(RankedChunk(chunk_id=row["chunk_id"], rank=len(results) + 1))
            if len(results) >= limit:
                break
        return results

    @staticmethod
    def _rank_map(items: Iterable[RankedChunk]) -> dict[str, int]:
        return {item.chunk_id: item.rank for item in items}

    def search(self, query: str, filters: SearchFilters, top_k: int) -> SearchResponse:
        started = time.perf_counter()
        dense = self._dense(query, filters)
        lexical = self._lexical(query, filters)
        query_signals = extract_signals(query)

        # Do not manufacture plausible-looking legal results for an unrelated query.
        # Dense-only matches are allowed when the input contains a recognised legal
        # signal; otherwise at least one corpus term must also match.
        if not lexical and not query_signals:
            return SearchResponse(
                runId=str(uuid.uuid4()),
                corpusVersion=self.corpus_version,
                modelVersion=self.model_version,
                retrievalMethod=f"Dense cosine + SQLite FTS5 + RRF(k={RRF_K})",
                extractedSignals=[],
                latencyMs=round((time.perf_counter() - started) * 1000),
                results=[],
            )

        dense_ranks = self._rank_map(dense)
        lexical_ranks = self._rank_map(lexical)
        fused: dict[str, float] = defaultdict(float)
        for chunk_id, rank in dense_ranks.items():
            fused[chunk_id] += 1.0 / (RRF_K + rank)
        for chunk_id, rank in lexical_ranks.items():
            fused[chunk_id] += 1.0 / (RRF_K + rank)

        ordered_chunks = sorted(fused, key=lambda chunk_id: (-fused[chunk_id], chunk_id))
        best_by_case: dict[str, str] = {}
        for chunk_id in ordered_chunks:
            case_id = self._chunks[chunk_id]["case_id"]
            best_by_case.setdefault(case_id, chunk_id)

        results: list[SearchResult] = []
        for case_id, chunk_id in list(best_by_case.items())[:top_k]:
            case = self._cases[case_id]
            chunk = self._chunks[chunk_id]
            case_signals = {signal.lower() for signal in case["legalIssues"]}
            shared = [signal for signal in query_signals if signal.lower() in case_signals]
            reason_codes: list[str] = []
            if chunk_id in dense_ranks:
                reason_codes.append("Semantic passage match")
            if chunk_id in lexical_ranks:
                reason_codes.append("Exact legal-term match")
            reason_codes.extend(f"Shared issue: {signal}" for signal in shared[:3])
            if filters.court != "All Courts" or filters.year != "All Years" or filters.issue != "All Issues":
                reason_codes.append("Active filter match")

            highlight = [token for token in lexical_tokens(query) if token in chunk["evidence"].lower()][:5]
            results.append(
                SearchResult(
                    id=case_id,
                    rank=len(results) + 1,
                    title=case["title"],
                    court=case["court"],
                    year=str(case["year"]),
                    category=case["category"],
                    citation=case["citation"],
                    posture=case["posture"],
                    legalIssues=case["legalIssues"],
                    filterIssues=case["legalIssues"],
                    matchedEvidence=chunk["evidence"],
                    highlightPhrases=highlight,
                    outcome="No generated outcome. Review the linked judgment and cited passage.",
                    whyItMatched=reason_codes,
                    explanation={
                        "sharedFacts": chunk["context"],
                        "sharedLegalIssues": ", ".join(shared or case["legalIssues"]),
                        "proceduralPosture": case["posture"],
                        "matchingTerms": highlight or shared or case["legalIssues"][:3],
                        "relation": "Requires human legal verification",
                    },
                    sourceUrl=case["sourceUrl"],
                    evidenceLocator=EvidenceLocator(section=chunk["section"], paragraph=chunk["paragraph"]),
                    reasonCodes=reason_codes,
                    denseRank=dense_ranks.get(chunk_id),
                    lexicalRank=lexical_ranks.get(chunk_id),
                    retrievalScore=round(fused[chunk_id], 6),
                )
            )

        return SearchResponse(
            runId=str(uuid.uuid4()),
            corpusVersion=self.corpus_version,
            modelVersion=self.model_version,
            retrievalMethod=f"Dense cosine + SQLite FTS5 + RRF(k={RRF_K})",
            extractedSignals=query_signals,
            latencyMs=round((time.perf_counter() - started) * 1000),
            results=results,
        )
