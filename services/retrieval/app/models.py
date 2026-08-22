from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


CourtLevel = Literal["Supreme Court", "High Court"]


class SearchFilters(BaseModel):
    court: str = "All Courts"
    year: str = "All Years"
    issue: str = "All Issues"

    @field_validator("court")
    @classmethod
    def validate_court(cls, value: str) -> str:
        allowed = {"All Courts", "Supreme Court", "High Court"}
        if value not in allowed:
            raise ValueError("Unsupported court filter")
        return value

    @field_validator("year")
    @classmethod
    def validate_year(cls, value: str) -> str:
        if value != "All Years" and (not value.isdigit() or not 1900 <= int(value) <= 2100):
            raise ValueError("Unsupported year filter")
        return value

    @field_validator("issue")
    @classmethod
    def validate_issue(cls, value: str) -> str:
        allowed = {
            "All Issues",
            "Regular Bail",
            "Anticipatory Bail",
            "Default Bail",
            "Prolonged Custody",
            "Documentary Evidence",
            "Witness Interference",
            "Flight Risk",
        }
        if value not in allowed:
            raise ValueError("Unsupported legal-issue filter")
        return value


class SearchRequest(BaseModel):
    query: str = Field(min_length=20, max_length=4000)
    filters: SearchFilters = Field(default_factory=SearchFilters)
    top_k: int = Field(default=10, alias="topK", ge=1, le=20)

    model_config = {"populate_by_name": True}

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned.split()) < 4:
            raise ValueError("Describe at least four meaningful words")
        return cleaned


class EvidenceLocator(BaseModel):
    section: str
    paragraph: str


class SearchResult(BaseModel):
    id: str
    rank: int
    title: str
    court: CourtLevel
    year: str
    category: str
    citation: str
    posture: str
    legalIssues: list[str]
    filterIssues: list[str]
    matchedEvidence: str
    highlightPhrases: list[str]
    outcome: str
    whyItMatched: list[str]
    explanation: dict[str, object]
    sourceUrl: str
    evidenceLocator: EvidenceLocator
    reasonCodes: list[str]
    denseRank: int | None = None
    lexicalRank: int | None = None
    retrievalScore: float


class SearchResponse(BaseModel):
    runId: str
    corpusVersion: str
    modelVersion: str
    retrievalMethod: str
    extractedSignals: list[str]
    latencyMs: int
    results: list[SearchResult]


class HealthResponse(BaseModel):
    status: Literal["ready", "starting"]
    corpusVersion: str
    modelVersion: str
    caseCount: int
    chunkCount: int
