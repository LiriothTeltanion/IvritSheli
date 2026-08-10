# 2.10.0 provenance note — 2026-08-10

The linguistic catalog remains reviewed separately from its art. The private 2.10.0 candidate expands exact semantic illustration coverage from the historical 2.8.3 milestone of 72 scenes to **240/240 reviewed concepts**. Illustration coverage does not change spelling, meaning, grammar or provenance claims.

# Hebrew content sourcing and provenance

**Status:** v2.9.1 content policy — private candidate dated 2026-07-27

**Last source review:** 2026-07-27

IvritSheli uses external resources to verify facts and design curricula; it does not treat public web access as permission to copy. Every imported definition, example, image, recording, corpus excerpt, translation, or CEFR descriptor must have an explicit source and reuse basis before it enters a distributable dataset.

The 72 exact semantic scenes in v2.8.3 (historical date not re-verified in this
slice) are original local SVG compositions
implemented in this repository. Their EN/ES/HE descriptions are versioned with
the reviewed lexicon. The remaining 168 concepts are explicitly presented as
category/emoji fallbacks rather than bespoke illustrations.

The 2.9.0 personal coach dated 2026-07-27 introduces no open-ended production
Hebrew. Its dictionary examples are eligible only from the reviewed starter
source or an entry explicitly marked `product_reviewed`. Its pattern library is
Ivrit Sheli editorial content with fixed Hebrew, allowed slots, level, context,
register, EN/ES translations and a stable source identifier. Searchable
imported dictionary content is not automatically coach-approved.

The 2.9.1 Hebrew Alphabet Studio adds a separate reviewed catalog of 22 base
letters and 5 positional final forms. Each unit must preserve its stable key,
pointed Hebrew name, sound context, final-form relationship, example,
translation, dictionary query, source IDs and content revision. Alphabet facts
do not authorize copied charts, recordings or source prose. Explanations and
examples remain original Ivrit Sheli editorial content with separate linguistic
and pedagogical review.

## Source hierarchy

Use the strongest suitable source for each claim:

1. official Hebrew language decisions and primary corpus documentation;
2. peer-reviewed linguistic research and documented datasets;
3. licensed lexicons or educational resources with clear version and attribution requirements;
4. reviewed IvritSheli editorial content based on multiple references;
5. AI-generated candidate content, always labeled and human-reviewed before becoming canonical.

An authoritative linguistic source can establish a fact; it does not automatically grant a license to reproduce its wording, examples, database, audio, or images.

## Approved reference registry

| Source | Appropriate use | Boundary before import or publication |
|---|---|---|
| [Academy of the Hebrew Language: Overview of Hebrew](https://eng.hebrew-academy.org.il/overview-of-hebrew/) | Root-pattern structure, consonant/vowel relationship, niqqud history, broad grammatical orientation. | Reference and fact-checking only unless a specific page's reuse terms allow more. Write original explanations and link to the source. |
| [Academy of the Hebrew Language: Final letters](https://hebrew-academy.org.il/category/%D7%90%D7%95%D7%AA%D7%99%D7%95%D7%AA-%D7%A1%D7%95%D7%A4%D7%99%D7%95%D7%AA/) | Official Hebrew reference category for positional final-letter questions. | Reference only; record the exact article used for any more specific decision. The category URL does not grant bulk-copy permission. |
| [Academy of the Hebrew Language: Orthography](https://eng.hebrew-academy.org.il/our-work/language-decisions/orthography/) | Vocalized/unvocalized spelling, niqqud context and modern vav/yod vowel-indicator guidance. | Reference and fact-checking only. Store original explanations and link to the exact rule when one governs a catalog form. |
| [University of Texas at Austin: Hebrew Consonants](https://hebrew.laits.utexas.edu/drupal/themes/hebrewgrid/bh/bhonline/grammar/consonants.pdf) | Cross-check 22 symbols, Modern Hebrew ב/כ/פ pairs, שׁ/שׂ and the five positional final forms. | Copyrighted educational reference; do not redistribute the chart, prose or exercises. Its Biblical-Hebrew framing requires Modern Israeli facts to be checked against contemporary sources. |
| [University of Cambridge: The Modern Hebrew Alphabet](https://www.mmll.cam.ac.uk/files/the_modern_hebrew_alphabet.pdf) | Modern Hebrew letter order, names, core sounds and the five final forms. | Reference/fact-checking chart. Do not copy its layout or instructional wording; Ivrit Sheli explanations, examples and visual treatment remain original. |
| [Academy terminology: סוֹפִית](https://terms.hebrew-academy.org.il/munnah/53146_1/%D7%A1%D7%95%D6%B9%D7%A4%D6%B4%D7%99%D7%AA) | Verify official terminology associated with `סופית`; use alongside a direct alphabet reference for the five positional forms. | Terminology reference only. It does not by itself license copied dictionary content or establish the complete alphabet curriculum. |
| [Academy language decisions](https://eng.hebrew-academy.org.il/our-work/language-decisions/) | Standard orthography, punctuation, transliteration, grammar, and approved terminology. | Record the decision URL and review date. Do not scrape or republish the terminology database without permission or a compatible license. |
| [Historical Dictionary Project](https://eng.hebrew-academy.org.il/our-work/historical-dictionary-project/) and [Ma'agarim database and terms](https://maagarim.hebrew-academy.org.il/) | Historical meaning, attestation, genre, and lexical-development research for advanced content. | Ma'agarim states that rights are reserved, use is for study/research, and commercial use requires prior written permission. It is **reference-only** for IvritSheli until written permission covers the intended use. |
| [HUJI Corpus of Spoken Hebrew](https://en-digitalhumanities.huji.ac.il/hcsh-huji-corpus-spoken-hebrew/) | Research into contemporary conversation, discourse, interaction, and prosody; candidate frequency/register validation. | The project page identifies recordings/transcripts but does not provide a broad application redistribution license and states all rights reserved. Do not import audio or transcripts until access and reuse terms are documented in writing. |
| [Knesset Corpus paper](https://doi.org/10.1007/s10579-025-09833-4) | Formal/institutional language research, morphosyntactic patterns, diachronic and register analysis for B1-C2 editorial planning. | The open-access article does not by itself license every corpus artifact. Verify the exact dataset release, files, speaker metadata, attribution, and license before any import. Do not copy protocol passages into beginner content merely because proceedings are public. |
| [CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4) | Curriculum alignment across reception, production, interaction, and mediation; can-do planning. | IvritSheli is CEFR-aligned/CEFR-lite, not certified. Store source page/descriptor references and prefer concise original paraphrases. Do not reproduce large descriptor tables without confirming Council of Europe reproduction terms. |
| [Campus IL: Know! Hebrew A1](https://campus.gov.il/en/course/know-hebrew-a1/) | Public benchmark for broad A1 skill coverage and integrated Israeli culture. | Use as a curriculum comparison, not as a source of copied lessons, scripts, illustrations, recordings, exercises, or translations. |
| [Kaikki/Wiktionary-derived data](https://kaikki.org/dictionary/Hebrew/) | Large lexical search layer when imported through the existing pipeline. | Preserve per-entry source, attribution, share-alike requirements, and database/version metadata. A compatible imported entry does not become IvritSheli-reviewed solely because it is searchable. |
| [Google Speech-to-Text languages](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages) and [Text-to-Speech voices](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) | Current provider capability and locale mapping (`iw-IL` STT; `he-IL` TTS). | Capability documentation is not learner-content licensing or pedagogical validation. Re-check voice availability and service terms at deployment. |
| [Azure speech language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment) and [assessment features](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) | Current `he-IL` provider capability and feature comparison. | As of 2026-07-22, `he-IL` is listed for Pronunciation Assessment, correcting the earlier assumption that it was unsupported. Detailed outputs remain feature-dependent; validate on the target learner population before showing educational scores. |

Provider privacy statements belong in a deployment review, not only in marketing copy. For the current speech pilot, consult [Google's data-usage FAQ](https://docs.cloud.google.com/speech-to-text/docs/v1/data-usage-faq), [Google data logging](https://docs.cloud.google.com/speech-to-text/docs/v1/data-logging), and [Azure Speech privacy and security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security). Do not opt into provider data logging for discounted pricing in the private pilot.

## Content provenance record

Every canonical or imported content object should be able to expose these fields, directly or through a linked source record:

```text
source_id
source_name
source_url
source_record_id
source_version_or_retrieved_at
license_name
license_url
license_scope
permission_status
content_origin
created_by
reviewed_by
reviewed_at
review_status
transformation_note
ai_provider_and_model
factual_confidence
```

Recommended values:

- `permission_status`: `approved_import`, `reference_only`, `written_permission`, `pending_review`, or `rejected`;
- `content_origin`: `ivrit_editorial`, `licensed_import`, `user_authored`, or `ai_candidate`;
- `review_status`: `unreviewed`, `linguistic_review`, `pedagogical_review`, `approved`, or `withdrawn`.

Missing licensing information resolves to `reference_only`, never to assumed permission.

## Field-level sourcing rules

| Content field | Minimum evidence before canonical publication |
|---|---|
| Alphabet name, order, sound and final-form relationship | Cross-check a direct Modern Hebrew alphabet reference and an Academy source where applicable. Distinguish mainstream Israeli realization, contextual sound value and heritage variation; never count five final shapes as separate letters. |
| Pointed and unpointed spelling | Academy decision, compatible reviewed lexicon, or qualified editorial review. Store both original and normalized forms without discarding niqqud. |
| Root, pattern, binyan, gender, number, inflection | Reviewed linguistic source for the exact sense/form. Homographs cannot borrow morphology from another sense. |
| English and Spanish meaning | Original IvritSheli translation with bilingual review, or a compatible licensed source. Record whether it is literal, functional, or contextual. |
| Register and tone | Multiple real-use observations or corpus evidence plus editorial review. Do not label a phrase aggressive, slang, or formal from one AI answer. |
| Frequency and curriculum level | Versioned corpus evidence or measured learner data plus an explicit rubric. Corpus frequency is not automatically beginner usefulness. |
| Example sentence | Original editorial example or a clearly licensed excerpt. It must be natural, level-appropriate, independently translated, and reviewed. |
| Coach pattern and slot | Original Ivrit Sheli pattern with fixed grammar, finite allowed values, EN/ES translations, target level/context/register and separate linguistic/pedagogical review. Runtime free-text slot filling is prohibited. |
| Niqqud or transliteration generated by AI | Candidate only until checked against a canonical source or reviewed by a qualified editor. |
| Illustration, icon, photograph | Original, commissioned, generated under documented terms, or licensed for the intended distribution. Store creator/tool, prompt or asset source, license, and alt text. |
| Human recording | Signed contributor consent covering storage, processing, distribution, removal, and compensation where applicable. |
| Synthetic recording | Provider, voice, date, input-text source, and applicable output/reuse terms. Reconfirm whether cached or redistributed audio is permitted. |
| Liturgical text | Verify the exact edition, pointing, translation, commentary, and recording independently. A source text may be public domain while a modern edition or performance is copyrighted. |

## Editorial workflow

1. Define the learner goal, track, level, skill, and target situation.
2. Select candidate forms from approved references without copying source prose.
3. Confirm spelling and morphology for the exact sense.
4. Write an original example and EN/ES explanation.
5. Check naturalness, register, RTL, niqqud, transliteration, and cultural context.
6. Attach provenance and license metadata.
7. Run linguistic and pedagogical review as separate gates.
8. Publish to the reviewed layer only after both gates pass.
9. Preserve corrections as versioned history; do not silently rewrite learner evidence.

AI may assist steps 2-5, but its output remains `ai_candidate`. It cannot authorize a license, establish a canonical fact, or serve as the only naturalness review.

### 2.9.0 coach release gate — 2026-07-27

Before a new coach pattern can move into the reviewed runtime library:

1. verify every inflected Hebrew form and required preposition;
2. confirm that each allowed slot preserves agreement and natural word order;
3. review literal and functional EN/ES translations independently;
4. label level, context and register conservatively;
5. assign a stable source ID and `product_reviewed` state;
6. test that no unreviewed imported dictionary example can enter the result;
7. include the example in a human pilot before using it as a public quality
   claim.

### 2.9.1 Alphabet Studio release gate — 2026-07-27

Before an alphabet unit can move into the reviewed runtime catalog:

1. verify its order, base/final identity and pointed Hebrew name;
2. separate mainstream Modern Israeli guidance from historical or
   community-specific realizations;
3. verify every niqqud example, transliteration and EN/ES/HE meaning;
4. ensure the example actually contains the target written form in the stated
   context;
5. attach stable source IDs, retrieval dates and original-editorial status;
6. test the playback text without treating browser TTS as linguistic evidence;
7. verify that its visual and sound confusion groups are pedagogically useful;
   and
8. include the unit in beginner recognition review before making a public
   usability claim.

## Corpus and quotation safeguards

- Prefer aggregate findings such as frequency bands, collocation candidates, or register signals over copied sentences.
- Keep the source record and exact query so an editor can reproduce a corpus-based decision.
- Apply minimum-group thresholds before surfacing demographic comparisons.
- Do not expose speaker identity, political affiliation, or personal metadata unless essential, lawful, licensed, and reviewed.
- Avoid long or distinctive excerpts. If a short quotation is pedagogically necessary, store the justification, source, word count, attribution, and reuse basis.
- Never convert a corpus sample directly into an illustration prompt containing identifiable people or sensitive events.

## Corrections, disputes, and takedowns

Every published learning item must support:

- learner reporting for factual, translation, cultural, accessibility, or licensing problems;
- source/review inspection without revealing private reviewer data;
- withdrawal without deleting prior learning attempts;
- migration to a corrected content version;
- an audit event explaining what changed and why.

If source permission is revoked or uncertain, withdraw the affected distributable content while retaining only the minimum internal identifiers required to reconcile learner history.

## Open licensing risks

The following remain blockers for bulk integration:

1. **Academy Ma'agarim:** commercial reuse requires prior written permission.
2. **HCSH recordings/transcripts:** no broad redistribution license was confirmed from the official project page.
3. **Knesset Corpus:** the exact downloadable artifact and license must be verified; article open access is not enough.
4. **CEFR descriptors:** extensive verbatim reproduction requires a terms review.
5. **Synthetic voice output:** caching and redistribution rights must be checked per provider and voice family.
6. **Liturgical materials:** text, edition, pointing, translation, commentary, and performance may have different rights holders.
7. **AI-generated illustrations and explanations:** model/provider terms, source contamination risk, cultural review, and accessibility remain separate checks.

Until a risk is resolved, IvritSheli may link to and consult the source but must not package its protected content.
