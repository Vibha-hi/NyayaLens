"""Run the local retrieval service and web development server together."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVICE_ROOT = PROJECT_ROOT / "services" / "retrieval"
PYTHON = SERVICE_ROOT / ".venv" / (Path("Scripts/python.exe") if os.name == "nt" else Path("bin/python"))


def main() -> None:
    imported_corpus = SERVICE_ROOT / "data" / "import" / "cases.json"
    sample_corpus = SERVICE_ROOT / "corpus" / "cases.json"
    if not PYTHON.is_file() or (not imported_corpus.is_file() and not sample_corpus.is_file()):
        print("Retrieval data is not installed; running the one-time setup...", flush=True)
        try:
            subprocess.run([sys.executable, str(PROJECT_ROOT / "scripts" / "setup_retrieval.py")], check=True)
        except subprocess.CalledProcessError:
            if not sample_corpus.is_file() or not PYTHON.is_file():
                raise
            print("Release bundle download failed; falling back to bundled demonstration corpus.", flush=True)

    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise SystemExit("npm was not found on PATH.")

    commands = (
        [
            str(PYTHON),
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            str(SERVICE_ROOT),
            "--host",
            "127.0.0.1",
            "--port",
            "8001",
        ],
        [npm, "run", "dev"],
    )
    processes = [subprocess.Popen(command, cwd=PROJECT_ROOT) for command in commands]
    exit_code = 0
    try:
        while all(process.poll() is None for process in processes):
            time.sleep(0.5)
        exit_code = next((process.returncode for process in processes if process.returncode is not None), 1)
    except KeyboardInterrupt:
        exit_code = 130
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
