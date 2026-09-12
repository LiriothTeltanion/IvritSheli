"""Drop container bootstrap privileges before executing the requested command."""

from __future__ import annotations

import os
import sys

RUNTIME_UID = 10001
RUNTIME_GID = 10001


def main(arguments: list[str] | None = None) -> int:
    """Replace this bootstrap process with a command running as the Ivrit user."""
    selected = list(sys.argv[1:] if arguments is None else arguments)
    if not selected:
        print("A command is required after the privilege bootstrap.", file=sys.stderr)
        return 2
    if os.geteuid() == 0:
        os.setgroups([])
        os.setgid(RUNTIME_GID)
        os.setuid(RUNTIME_UID)
        os.environ.update(
            {
                "HOME": "/app",
                "USER": "ivrit",
                "LOGNAME": "ivrit",
            }
        )
    os.execvp(selected[0], selected)
    return 1  # pragma: no cover - os.execvp replaces the process on success.


if __name__ == "__main__":
    raise SystemExit(main())
