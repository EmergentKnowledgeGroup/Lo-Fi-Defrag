#!/usr/bin/env python3
"""One-click launcher for macOS and Linux."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import List, Optional, Sequence


REPO_ROOT = Path(__file__).resolve().parent
PRODUCT_NAME = "Lo-fi Defragger"
PACKAGED_LINUX_BINARY = os.environ.get("LOFI_DEFRAGGER_PACKAGED_BINARY", PRODUCT_NAME)
DEV_COMMAND = ["npm", "run", "dev"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Launch Lo-fi Defragger on macOS/Linux in packaged or dev mode."
    )
    parser.add_argument(
        "--source",
        action="store_true",
        help="Force source/dev mode even if a packaged app is available.",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Force `npm ci` before launching source/dev mode.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the command that would run and exit.",
    )
    return parser.parse_args()


def ensure_supported_platform() -> None:
    if sys.platform == "win32":
        raise SystemExit(
            "launch.py is for macOS/Linux. On Windows, build or run the EXE path instead."
        )


def run_command(
    command: Sequence[str], *, dry_run: bool = False, cwd: Optional[Path] = None
) -> int:
    printable = " ".join(command)
    print(f"> {printable}")
    if dry_run:
        return 0
    completed = subprocess.run(list(command), cwd=str(cwd) if cwd else None)
    return completed.returncode


def find_packaged_command() -> Optional[List[str]]:
    out_dir = REPO_ROOT / "out"
    if not out_dir.exists():
        return None

    if sys.platform == "darwin":
        app_bundles = sorted(out_dir.glob(f"{PRODUCT_NAME}-darwin-*/*.app"))
        if app_bundles:
            opener = shutil.which("open")
            if not opener:
                return None
            return [opener, str(app_bundles[0])]
        return None

    if sys.platform.startswith("linux"):
        linux_dirs = sorted(out_dir.glob(f"{PRODUCT_NAME}-linux-*"))
        for directory in linux_dirs:
            candidates = [
                child
                for child in directory.iterdir()
                if child.is_file() and os.access(child, os.X_OK)
            ]
            named_candidate = next(
                (child for child in candidates if child.name == PACKAGED_LINUX_BINARY),
                None,
            )
            if named_candidate:
                return [str(named_candidate)]
            if candidates:
                return [str(candidates[0])]

    return None


def ensure_tool(name: str) -> None:
    if shutil.which(name):
        return
    raise SystemExit(
        f"Missing required tool: {name}. Install Node.js/npm first, then run launch.py again."
    )


def needs_npm_install() -> bool:
    node_modules = REPO_ROOT / "node_modules"
    return not node_modules.exists()


def main() -> int:
    args = parse_args()
    ensure_supported_platform()

    if not args.source:
        packaged_command = find_packaged_command()
        if packaged_command:
            return run_command(packaged_command, dry_run=args.dry_run)

    ensure_tool("node")
    ensure_tool("npm")

    if args.install or needs_npm_install():
        install_command = ["npm", "ci"]
        install_result = run_command(install_command, dry_run=args.dry_run, cwd=REPO_ROOT)
        if install_result != 0:
            return install_result

    return run_command(DEV_COMMAND, dry_run=args.dry_run, cwd=REPO_ROOT)


if __name__ == "__main__":
    sys.exit(main())
