"""Download the public embedding model once; no account or API key is required."""

from fastembed import TextEmbedding

from app.engine import MODEL_CACHE, MODEL_NAME


def main() -> None:
    MODEL_CACHE.mkdir(parents=True, exist_ok=True)
    model = TextEmbedding(model_name=MODEL_NAME, cache_dir=str(MODEL_CACHE), threads=2)
    next(iter(model.query_embed("legal retrieval model readiness check")))
    print(f"Ready: {MODEL_NAME} is cached at {MODEL_CACHE}")


if __name__ == "__main__":
    main()
