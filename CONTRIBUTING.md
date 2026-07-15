# Contributing

## Principles

- Keep the offline experience complete.
- Make AI output inspectable and correctable.
- Preserve Hebrew RTL behavior and keyboard accessibility.
- Treat personal context as sensitive by default.
- Prefer small, typed, testable functions.
- Add source provenance to imported linguistic data.

## Development flow

```bash
./scripts/setup.sh
./scripts/test-all.sh
```

Create a focused branch, add tests, run formatting/type checks where available, and use a conventional commit message, for example:

```text
feat: Add root-family recommendations ✅
fix: Preserve niqqud during dictionary lookup 🧰
docs: Explain Google read-only scopes 💡
```

## Pull-request checklist

- [ ] Tests pass.
- [ ] No secrets or personal data are committed.
- [ ] Public functions include docstrings/JSDoc.
- [ ] RTL and reduced-motion behavior were considered.
- [ ] New AI features include an offline fallback.
- [ ] New imported data includes provenance and license notes.
