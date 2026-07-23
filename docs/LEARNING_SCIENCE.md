# Learning science evidence ledger

**Status:** v2.6 product contract

**Last evidence review:** 2026-07-22

This document converts the 16-page IvritSheli learning-methods research brief — archived at [research/ivrit-sheli-learning-research.pdf](research/ivrit-sheli-learning-research.pdf) — into product decisions. The brief is useful synthesis, but it is not treated as an authority by itself. Claims below are anchored to primary publications, systematic reviews, or official capability documentation.

## Evidence labels

- **Strong**: replicated or meta-analytic evidence with close relevance to second-language learning.
- **Moderate-strong, short-term**: positive synthesis, but limited follow-up or limited direct Hebrew evidence.
- **Moderate**: useful evidence with important task, population, or implementation constraints.
- **Conditional**: the effect depends heavily on content, learner, or implementation; it is not a default prescription.
- **Unvalidated for Hebrew**: a provider capability or general-language result exists, but the pedagogical measurement has not been validated for IvritSheli's Hebrew learners.

## Product evidence ledger

| Claim | Evidence strength | Product decision | Guardrail | Primary source |
|---|---|---|---|---|
| Distributed practice improves L2 retention compared with massed practice. | **Strong** | Schedule delayed reviews across separate sessions and evaluate retention at 24 hours, 7 days, and 30 days. | Do not present one interval sequence as universal. Equal and expanding schedules were statistically equivalent in the cited synthesis, and the best delay depends on the retention target and task. | [Kim & Webb, 2022](https://doi.org/10.1111/lang.12479) |
| Attempting retrieval improves classroom learning and can support transfer. | **Strong** | Ask for an unassisted answer before revealing the model; follow unsuccessful retrieval with focused corrective information and another attempt. | Retrieval must remain achievable. Repeated failure without support is not productive practice, and recognition does not prove productive command. | [Yang et al., 2021](https://doi.org/10.1037/bul0000309); [Pan & Rickard, 2018](https://doi.org/10.1037/bul0000151) |
| Extensive, level-appropriate reading benefits second- and foreign-language learning in the short term. | **Moderate-strong, short-term** | Offer short graded Hebrew texts with optional niqqud, glosses, learner choice within an appropriate band, and a light comprehension or retrieval task. | The 2025 review includes **73 studies and 82 interventions**, not 51. It found only four follow-up comparisons and 80 of 82 interventions targeted English; it does not establish long-term Hebrew-specific effects. | [Sangers et al., 2025](https://doi.org/10.1007/s10648-025-10068-6) |
| Output is most useful when paired with relevant input, explicit correction, and a chance to revise. | **Moderate** | Use an output-feedback-retry cycle: one focused correction, then a corrected spoken or written response. | Output alone does not reliably cause noticing. Avoid correcting every feature at once, and do not generalize classroom findings directly to automated Hebrew speaking assessment. | [Izumi & Bigelow, 2000](https://doi.org/10.2307/3587952); [Lyster & Saito, 2010](https://doi.org/10.1017/S0272263109990520) |
| Interleaving can improve discrimination between similar categories. | **Conditional** | Use interleaving after initial acquisition for confusable binyanim, gender/number forms, prepositions, roots, and sound contrasts. | Teach unfamiliar vocabulary in coherent blocks first. The meta-analysis found substantial heterogeneity and word-learning studies could favor blocking. | [Brunmair & Richter, 2019](https://doi.org/10.1037/bul0000209) |
| Gamification can support learning, motivation, and behavior. | **Conditional** | Award XP and achievements for delayed recall, corrected output, transfer, consistent practice, and voluntary real-life use. Keep XP separate from mastery. | Effects are heterogeneous; motivation and behavior were less stable in high-rigor subsets. Do not reward taps, compulsory streaks, or time-on-screen as learning. | [Sailer & Homner, 2020](https://doi.org/10.1007/s10648-019-09498-w) |
| Technology-supported personalization can improve outcomes. | **Conditional** | Adapt modality, support level, item priority, and review timing from observable learner evidence; expose the reason for every recommendation. | Evidence spans different subjects and populations and does not justify opaque AI control. The learner can inspect, override, and reset inferred preferences. | [Zheng et al., 2022](https://doi.org/10.1007/s10639-022-11092-7); [Alrawashdeh et al., 2024](https://doi.org/10.1016/j.edurev.2023.100587) |
| ASR-assisted pronunciation practice can help L2 learners. | **Moderate in ESL/EFL; unvalidated for Hebrew** | Use transcription, expected-text alignment, missing/extra/reordered tokens, and a plainly labeled **Recognition match**. Offer explicit, low-load retry guidance. | The cited meta-analysis concerns ESL/EFL, with stronger results for segmentals, adults, intermediate learners, and explicit feedback. A transcript match is not phoneme accuracy, intelligibility, accent, or clinical assessment. | [Ngo, Chen & Lai, 2024](https://doi.org/10.1017/S0958344023000113); [Amrate & Tsai, 2024](https://www.cambridge.org/core/journals/recall/article/computerassisted-pronunciation-training-a-systematic-review/71E786F7DFC99727837909FDED7A2320) |
| Cloud providers currently expose Hebrew speech capabilities. | **Capability confirmed; educational validity unproven** | Keep provider adapters behind consent and feature flags. Benchmark Google STT/TTS and Azure against the same Hebrew learner set before choosing defaults. | Google STT V2 lists Hebrew as `iw-IL`; Google TTS uses `he-IL`. As of this review, Azure lists `he-IL` for Pronunciation Assessment, correcting an earlier unsupported-status assumption, but detailed syllable/spoken-phoneme outputs remain feature-limited and no provider score is validated for IvritSheli's learners. | [Google STT languages](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages); [Google TTS voices](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types); [Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment); [Azure assessment features](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) |

## Required learning loop

Every scored lesson follows the seven-phase contract defined in [Learning Core v2.6](LEARNING_CORE_V2_6.md):

1. contextual encounter;
2. unassisted retrieval;
3. reviewed reference feedback and self-correction;
4. corrected output or retry;
5. adaptive delayed review;
6. transfer task;
7. reflection with a visible, privacy-safe learning log.

Individual activity types may be shorter, but they must not award mastery for exposure alone. A reveal, replay, translation view, or AI explanation is support, not evidence of recall.

## Decision rules for experiments

An experimental learning feature must declare:

1. its evidence label and target learner;
2. the learner behavior it intends to change;
3. a falsifiable success metric;
4. a safe fallback;
5. what the UI must not claim;
6. a review date and owner.

Features with uncertain educational value remain opt-in during the private pilot. No experiment can silently alter canonical dictionary facts, erase learning history, or convert vendor confidence into mastery.

## Measurement contract

The primary educational outcomes are:

- unassisted recall at 24 hours, 7 days, and 30 days;
- supported and unsupported Hebrew reading accuracy;
- listening comprehension on unseen but level-matched material;
- successful corrected output after feedback;
- transfer to an unseen sentence or real-life mission;
- learner-rated feedback helpfulness and correction appeals.

Completion, streaks, XP, WAU/MAU, and time in app are supporting product measures, not proof of learning. Speech quality monitoring also includes word/character error rate by task, failure rate, p90 response latency, provider cost, and false-positive correction rate.

## Non-claims

IvritSheli v2.6 does not claim:

- CEFR certification or an accredited level assessment;
- a complete A0-C2 Hebrew course;
- perfect scheduling intervals;
- perfect phoneme, accent, prosody, or native-likeness scoring;
- that a provider's Hebrew locale is pedagogically validated;
- that XP, streaks, or engagement equal language mastery;
- Hebrew-specific causality where the evidence comes mostly from English-learning populations.
