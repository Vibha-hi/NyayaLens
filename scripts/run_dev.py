"""Run the local retrieval service and web development server together."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVICE_ROOT = PROJECT_ROOT / "services" / "retrieval"
PYTHON = SERVICE_ROOT / ".venv" / (Path("Scripts/python.exe") if os.name == "nt" else Path("bin/python"))
DEFAULT_RETRIEVAL_URL = "http://127.0.0.1:8001"


def _configured_retrieval_url() -> str:
    """Read only the service URL Vite will use; never load or print secrets."""

    configured = os.environ.get("RETRIEVAL_SERVICE_URL", "").strip().strip('"\'')
    if configured:
        return configured.rstrip("/")
    for filename in (".env.local", ".env"):
        path = PROJECT_ROOT / filename
        if not path.is_file():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            if name.strip() == "RETRIEVAL_SERVICE_URL":
                return value.strip().strip('"\'').rstrip("/")
    return DEFAULT_RETRIEVAL_URL


def _service_is_ready(url: str, *, timeout: float = 2) -> bool:
    try:
        # The caller validates that this is a loopback URL before probing it.
        with urlopen(f"{url}/health", timeout=timeout) as response:  # noqa: S310
            return response.status == 200
    except OSError:
        return False


def _local_service_port(url: str) -> int | None:
    parsed = urlsplit(url)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        return None
    return parsed.port or 80


def main() -> None:
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise SystemExit("npm was not found on PATH.")

    service_url = _configured_retrieval_url()
    service_port = _local_service_port(service_url)
    service_ready = service_port is not None and _service_is_ready(service_url)
    corpus = SERVICE_ROOT / "data" / "import" / "cases.json"
    if (
        service_port is not None
        and not service_ready
        and (not PYTHON.is_file() or not corpus.is_file())
    ):
        print("Retrieval data is not installed; running the one-time setup...", flush=True)
        subprocess.run([sys.executable, str(PROJECT_ROOT / "scripts" / "setup_retrieval.py")], check=True)

    commands: list[list[str]] = []
    if service_port is not None and not service_ready:
        commands.append(
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
                str(service_port),
            ]
        )
    elif service_port is not None:
        print(f"Using the retrieval service already running at {service_url}.", flush=True)
    else:
        print(f"Using the configured remote retrieval service at {service_url}.", flush=True)
    commands.append([npm, "run", "dev:web"])
    processes: list[subprocess.Popen[bytes]] = []
    exit_code = 0
    try:
        if len(commands) == 2:
            print("Preparing the local retrieval service...", flush=True)
            backend = subprocess.Popen(commands[0], cwd=PROJECT_ROOT)
            processes.append(backend)
            # Start the UI immediately while the large local corpus/model warms
            # in the background. Searches still wait for the health request,
            # but the page itself is available within a few seconds.
            processes.append(subprocess.Popen(commands[-1], cwd=PROJECT_ROOT))
            deadline = time.monotonic() + 120
            while True:
                if backend.poll() is not None:
                    raise SystemExit(backend.returncode or 1)
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise SystemExit(
                        "Retrieval service did not become ready within 120 seconds."
                    )
                # Once Uvicorn accepts the health request, let that single
                # request finish loading the corpus/model. Repeated short
                # timeouts can otherwise start concurrent lazy initializations.
                if _service_is_ready(service_url, timeout=max(1, remaining)):
                    break
                time.sleep(0.5)
            print("Retrieval service is ready; the website is running.", flush=True)
        else:
            processes.append(subprocess.Popen(commands[-1], cwd=PROJECT_ROOT))
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
