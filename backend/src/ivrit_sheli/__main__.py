"""
Module: package entry point
Purpose: Enable `python -m ivrit_sheli` without exposing CLI internals.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from ivrit_sheli.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
