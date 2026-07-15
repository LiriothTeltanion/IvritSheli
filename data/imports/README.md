# Full Hebrew Dictionary Import

This directory accepts the attributed Kaikki/Wiktionary Hebrew JSONL export.
The repository ships a small demo lexicon so the interface works immediately; the complete
lexicon is installed with:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --download-dictionary
```

Or place a compatible JSONL file here and run:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli \
  --dictionary-jsonl data/imports/kaikki.org-dictionary-Hebrew.jsonl
```

The imported database retains source and license metadata. Redistribution must preserve the
notices in `THIRD_PARTY_NOTICES.md`.
