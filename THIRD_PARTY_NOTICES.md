# Third-party notices

## Wiktionary and Kaikki dictionary content

The optional full Hebrew dictionary is derived from English Wiktionary data processed by Kaikki.org and Wiktextract.

- Source: https://kaikki.org/dictionary/Hebrew/
- Original project: https://en.wiktionary.org/
- Extractor: https://github.com/tatuylonen/wiktextract
- Wiktionary contributor attribution: https://en.wiktionary.org/wiki/Wiktionary:Copyrights

Dictionary content is not covered solely by this repository's MIT license. It is made available under the applicable Wiktionary terms, including Creative Commons Attribution-ShareAlike and GNU Free Documentation License terms. Preserve source attribution, license metadata, and share-alike obligations when distributing a populated dictionary database or derivative content.

The source code that downloads, normalizes, indexes, and displays dictionary data remains MIT-licensed. Imported definitions, examples, pronunciation URLs, forms, and related lexical data retain their source terms.

## OpenAI

OpenAI is an optional external service. No OpenAI code, model weights, or credentials are distributed. Users provide their own API key and remain responsible for applicable service terms and costs.

## Self-hosted speech runtime

The private v2.9 candidate can download and run the following components:

- `faster-whisper 1.2.1`, MIT License.
- CTranslate2, MIT License.
- `Systran/faster-whisper-small`, a CTranslate2 conversion of the OpenAI
  Whisper small model, MIT License. Model files are downloaded to the
  configured private cache and are not committed to this repository.
- OpenAI Whisper code and model weights, MIT License.

Preserve the applicable copyright and license notices if distributing an image
or offline bundle that includes the model or runtime.

## Web Push and subscription encryption

- `pywebpush 2.3.0`, Mozilla Public License 2.0.
- `cryptography 49.0.0`, Apache License 2.0 or BSD 3-Clause.

Browser Push services are operated by their respective browser/platform
providers and remain subject to those providers' terms. This repository does
not distribute VAPID keys or live Push subscriptions.

## Google Workspace

Google Calendar, Gmail, and Drive are optional read-only integrations. No Google credentials are distributed. Users configure their own OAuth application and consent scopes.

## Gveret Levin Hebrew handwriting font

The red `שלי` signature in the application wordmark uses
`GveretLevin-Regular.ttf` from the Google Fonts repository. The font is
distributed under the SIL Open Font License 1.1.

- Source: https://github.com/google/fonts/tree/main/ofl/gveretlevin
- Bundled license: `frontend/public/fonts/GveretLevin-OFL.txt`

Preserve the bundled OFL notice when redistributing the font.

## Custom graphics

The Ivrit Sheli application icon, interface previews, illustrations, and
achievement badge SVGs in `assets/` were created for this project and are
distributed under the repository's MIT license. The wordmark's handwriting
font remains covered by the separate OFL notice above.

## Bundled research brief

`docs/research/ivrit-sheli-learning-research.pdf` is a commissioned learning-methods brief written for this project and distributed under the repository's MIT license. It is documentation of the evidence base behind the Learning Core, not a third-party publication. The primary studies and provider documentation it cites remain the property of their respective authors and publishers; those works are referenced by link in [`docs/LEARNING_SCIENCE.md`](docs/LEARNING_SCIENCE.md) and are not redistributed here.

## Custom graphics — reserved mark

The personal `KC ✦ LT` signature files at `assets/brand/kc-lt-signature.*` are Kevin Cusnir / Lirioth Teltanion's reserved identity mark. They are excluded from the MIT asset grant: copyright © 2026 Kevin Cusnir, all rights reserved. Repository forks may retain the mark only for accurate attribution and may not use it to imply Kevin's authorship, endorsement, or identity for another product.
