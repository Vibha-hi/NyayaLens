"""Install the local retrieval runtime and its versioned GitHub release bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import venv
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVICE_ROOT = PROJECT_ROOT / "services" / "retrieval"
MANIFEST_PATH = SERVICE_ROOT / "bundle_manifest.json"
REQUIRED_BUNDLE_FILES = (
    SERVICE_ROOT / "data" / "import" / "cases.json",
    SERVICE_ROOT / "data" / "search.db",
    PROJECT_ROOT / "data" / "processed" / "judgments.csv",
    PROJECT_ROOT / "data" / "processed" / "ingestion_qa.csv",
)


def venv_python() -> Path:
    suffix = Path("Scripts/python.exe") if os.name == "nt" else Path("bin/python")
    return SERVICE_ROOT / ".venv" / suffix


def run(command: list[str]) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=PROJECT_ROOT, check=True)


def ensure_environment() -> Path:
    python = venv_python()
    if not python.is_file():
        print("Creating retrieval virtual environment...", flush=True)
        venv.EnvBuilder(with_pip=True).create(SERVICE_ROOT / ".venv")
    run([str(python), "-m", "pip", "install", "-r", str(SERVICE_ROOT / "requirements.txt")])
    return python


def download_with_http(url: str, destination: Path) -> None:
    token = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")
    headers = {"User-Agent": "precedent-finder-retrieval-setup"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request) as response, destination.open("wb") as output:
            total = int(response.headers.get("Content-Length", "0"))
            copied = 0
            while block := response.read(1024 * 1024):
                output.write(block)
                copied += len(block)
                if total:
                    print(f"Downloaded {copied / 1024 / 1024:.0f}/{total / 1024 / 1024:.0f} MiB", end="\r")
        print()
    except urllib.error.HTTPError as error:
        if error.code in {401, 403, 404}:
            raise RuntimeError(
                "The release asset is not publicly accessible. For a private repository, install "
                "GitHub CLI and run 'gh auth login', or set GH_TOKEN before running setup again."
            ) from error
        raise


def download_bundle(manifest: dict[str, object], destination: Path) -> None:
    repository = str(manifest["repository"])
    tag = str(manifest["releaseTag"])
    asset = str(manifest["assetName"])
    gh = shutil.which("gh")
    if gh:
        result = subprocess.run(
            [gh, "release", "download", tag, "--repo", repository, "--pattern", asset, "--dir", str(destination.parent)],
            cwd=PROJECT_ROOT,
            check=False,
        )
        downloaded = destination.parent / asset
        if result.returncode == 0 and downloaded.is_file():
            if downloaded != destination:
                downloaded.replace(destination)
            return
        print("GitHub CLI download was unavailable; trying the release URL directly...", flush=True)
    url = f"https://github.com/{repository}/releases/download/{tag}/{asset}"
    download_with_http(url, destination)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def extract_safely(bundle: Path) -> None:
    root = PROJECT_ROOT.resolve()
    allowed_prefixes = ("data/incoming/", "data/processed/", "services/retrieval/data/")
    allowed_roots = tuple((root / prefix.rstrip("/")).resolve() for prefix in allowed_prefixes)
    with zipfile.ZipFile(bundle) as archive:
        for info in archive.infolist():
            normalized = info.filename.replace("\\", "/").lstrip("/")
            if not normalized or info.is_dir():
                continue
            if not normalized.startswith(allowed_prefixes):
                raise RuntimeError(f"Unexpected bundle path: {normalized}")
            destination = (root / normalized).resolve()
            if not any(destination == allowed or destination.is_relative_to(allowed) for allowed in allowed_roots):
                raise RuntimeError(f"Unsafe bundle path: {normalized}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as source, destination.open("wb") as output:
                shutil.copyfileobj(source, output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Download and replace an existing corpus bundle")
    parser.add_argument("--skip-model", action="store_true", help="Do not download/verify the embedding model")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    expected_hash = str(manifest["sha256"])
    if expected_hash == "PENDING":
        raise SystemExit("The retrieval bundle manifest has not been finalized by the maintainer.")

    if args.force or not all(path.is_file() for path in REQUIRED_BUNDLE_FILES):
        with tempfile.TemporaryDirectory(prefix="precedent-retrieval-") as temporary:
            bundle = Path(temporary) / str(manifest["assetName"])
            print(f"Downloading corpus {manifest['corpusVersion']}...", flush=True)
            download_bundle(manifest, bundle)
            actual_hash = sha256(bundle)
            if actual_hash.lower() != expected_hash.lower():
                raise RuntimeError(f"Bundle checksum mismatch: expected {expected_hash}, received {actual_hash}")
            print("Checksum verified; extracting corpus...", flush=True)
            extract_safely(bundle)
    else:
        print("Retrieval corpus is already present; use --force to replace it.", flush=True)

    python = ensure_environment()
    if not args.skip_model:
        run([str(python), str(SERVICE_ROOT / "bootstrap_model.py")])

    missing = [str(path.relative_to(PROJECT_ROOT)) for path in REQUIRED_BUNDLE_FILES if not path.is_file()]
    if missing:
        raise RuntimeError("Setup completed with missing files: " + ", ".join(missing))
    print(
        f"Retrieval setup complete: {manifest['caseCount']} judgments and "
        f"{manifest['chunkCount']} searchable passages.",
        flush=True,
    )


if __name__ == "__main__":
    main()
