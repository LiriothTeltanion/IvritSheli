# Competitive Benchmark 2026

## Purpose and boundary

This document consolidates the language-product research recovered from the
Claude workflow `wf_8c2979ba-9ed` and the real-use feedback supplied by Kevin
after his mother tried Ivrit Sheli. It is a product decision ledger, not proof
that a competitor feature causes learning.

The benchmark answers four questions:

1. What should Ivrit Sheli adopt directly?
2. What should it adapt to its private-first, Hebrew-specific learning model?
3. What should it explicitly avoid?
4. What remains an experiment until a real beginner can complete a session
   without help?

The approved v2.8 direction is A0–A2 structured learning with a clearly labelled
B1/B2 laboratory, a deterministic local learning engine, no bundled paid LLM,
and no social or community surface before the mother pilot.

## Traceability and evidence grades

| ID | Evidence | Grade | Use |
|---|---|---:|---|
| U1 | Kevin's real-use feedback attachment `1f9ee7c1…/pasted-text.txt` | Direct product evidence | The target beginner did not understand Today; dark-theme surfaces were also measured as unreadable. |
| U2 | Approved v2.8 implementation plan, 2026-07-26 | Product decision | Locks scope: beginner-first, local learning engine, healthy motivation, social deferred. |
| C1 | Claude agent `a832cf5951c8c9665` | Structured secondary research | Beginner/senior usability, onboarding, plain language, type and touch targets. |
| C2 | Claude agent `a84a539b89eee64aa` | Structured competitor research | Duolingo path, practice, Guidebooks, Energy, XP and Hebrew-course gaps. |
| C3 | Claude agent `a7964e2ea02229d80` | Structured competitor research | Drops/Scripts/Memrise visual vocabulary, alphabet, audio and short sessions. |
| C4 | Claude agent `a1cba561c8f923021` | Structured competitor research | Community, caregiver/companion patterns, privacy and older-adult risks. |
| P1 | Official product or standards documentation | Primary descriptive evidence | Confirms what a product or standard currently says it provides. |
| S1 | Peer-reviewed or systematic-review source | Research evidence | Informs design; does not prove an Ivrit Sheli outcome. |
| J1 | Ivrit Sheli product judgement | Internal hypothesis | Must be verified through usability or learning evidence. |

Competitor pages can change. Links were consolidated on 2026-07-26 and must be
rechecked before making time-sensitive comparative claims in public material.
Secondary conversion anecdotes and competitor marketing statistics are excluded
unless independently supported. In particular, this ledger does not repeat an
unverified claim that delaying signup improves conversion by a specific
percentage.

## Adopt

| Decision | Ivrit Sheli implementation | Trace |
|---|---|---|
| Teach before configuration | Let a new visitor hear and practise three reviewed Hebrew words before profile, level or account questions. Default to Guided/A0. | U1, U2, C1, C2 |
| One obvious next action | Guided Today answers “What do I do now?” with one large action. Technical evidence remains inspectable behind one disclosure. | U1, C1, C2 |
| A guided path with an exit | Make the linear path the Guided default while Explorer and Experienced retain free navigation. Guided is a starting aid, not a cage. | C1, C2 |
| Plain pre-lesson guide | Show a short “Before you start” card with the words, sounds and goal used in the next lesson. | C2 |
| Personalised practice node | Insert an explicit practice step selected from SRS urgency, mistakes and reviewed curriculum data; explain the reason in plain language. | C1, C2 |
| Unlimited mistake recovery | Offer a free end-of-session retry of mistakes. Do not block learning after errors. | C2 |
| Unassisted challenge | Offer an optional no-hint attempt as evidence of retrieval, without calling it CEFR certification or global mastery. | C2 |
| Sound-first Hebrew reading track | Teach sound value first and letter name second in a separate alphabet/reading path covering 22 letters and final forms. | C2, C3 |
| Visual retrieval cues | Give reviewed concepts distinguishable visual identities and reveal the image progressively as a hint rather than always exposing the answer. | C3 |
| Actionable empty states | Every empty state explains the state and offers one useful next action. | U1, C1 |
| Persistent help and reversible actions | Guided mode always exposes labelled Help; risky or confusing actions support cancellation or reversal. | C1 |
| Accessibility floor | Use plain labels, readable functional text, large Hebrew with niqqud, at least 48 px touch targets and reflow at 200% zoom. Specific pixel choices remain engineering decisions verified in QA. | U1, C1, P1 |

## Adapt

| Competitor pattern | Ivrit Sheli adaptation | Guardrail | Trace |
|---|---|---|---|
| Streaks and XP | Keep them as attendance and effort signals, separate from mastery and retention evidence. Include a rest-day grace. | Never use XP to write skill mastery. | C1, C2 |
| “Explain my answer” | Use reviewed, hand-authored A0–A2 explanations and deterministic rules. | No LLM-generated grammar fact in the public v2.8 learning loop. | U2, C2 |
| AI conversation/video call | Reuse only the scaffold: short prompt, role, response and reflection. | No paid public LLM, accent score or simulated “native judgement”. | U2, C2 |
| Short-session model | End a session when the planned meaningful work is complete, with an honest time estimate. | No paywall timer, arbitrary cutoff or “energy” meter. | C3 |
| Memrise-style real-speaker context | Consider reviewed short audio clips with a still portrait or contextual scene. | Consent, licence and speaker provenance are required; browser TTS remains labelled synthetic. | C3 |
| Visual vocabulary gestures | Use tap and keyboard selection in Guided mode. | Do not require drag gestures; preserve 48 px targets and screen-reader operation. | C3 |
| Mnemonics | Let the learner save a private personal note or association. | Do not present generated mnemonic imagery as a linguistic fact. | C3 |
| Family/social accountability | After the beginner pilot, evaluate one invited companion with explicit consent and a server-side data allowlist. | No public profiles, rankings, real-time presence or access to phrases, reflections, errors or audio. | U2, C4 |
| Community correction | If evaluated later, use a known invited person and curated content. | A correction remains unverified until reviewed; it cannot directly award mastery. | C4 |

## Avoid

| Refusal | Reason | Trace |
|---|---|---|
| Hearts, Energy or lives that stop practice | Punishes the retrieval and correction loop the product is designed to encourage. | C2 |
| Leagues, leaderboards and ranks | Effort ranking is not learning evidence and adds pressure for a beginner who already struggles with navigation. | U1, C2, C4 |
| Open stranger matching, chat, forums or public user-generated courses | These are moderation and trust-and-safety systems, not small learning features. | C4 |
| Automated guilt nudges | A human may later send an explicit private note; the product will not generate shame about inactivity or streak loss. | C4 |
| Shared-streak failure mechanics | Another person must not be able to break a learner's rest rhythm or make absence feel like betrayal. | C4 |
| CEFR-like global score | The app may store a planning band and per-skill evidence, but it will not claim certification or one objective language score. | C2 |
| Unvalidated phoneme or accent score | Browser transcription can show a labelled recognition match only. | U2, C2 |
| Mechanical niqqud thinning | Removing marks by character-index parity is not a linguistic support ladder. Use reviewed `reading_hints`, or show full/no niqqud. | C3 |
| Mandatory drag interaction | Dragging adds motor and discoverability cost without improving the learning contract. | C3 |
| Long first-run questionnaire | Level, mode, goal, voice and display settings should not precede the first Hebrew success. | C1, C2, C3 |
| Icons without text in Guided mode | Beginners must not need to infer navigation meaning from a symbol. | C1 |
| Social UI hidden only by muted notifications | Guided v2.8 contains no social tab, badge, invite or empty community card. | U2, C4 |

## Experiment after the mother pilot

Experiments do not enter the public learning claim until their observed outcome
is recorded. The first gate is an unassisted usability session: open the
WhatsApp link, find the primary action within 30 seconds, learn three words,
complete one daily session, reload, and find the saved progress.

| Experiment | Acceptance signal | Stop condition | Trace |
|---|---|---|---|
| Finger tracing for Hebrew letters | Improves recognition without blocking keyboard/tap alternatives. | False precision, inaccessible gesture or no observed benefit. | C3, J1 |
| Learner-authored mnemonic notes | Learner can retrieve the word more easily and understands the note is private. | Notes distract from retrieval or are mistaken for dictionary facts. | C3 |
| Reviewed real-speaker clips | Learners use slow/normal audio and can distinguish it from synthetic speech. | Licensing, consent or provenance cannot be shown. | C3 |
| One invited companion | Beginner opts in and completes sessions without feeling watched or ranked. | Confusion, pressure, privacy leakage or caregiver control without per-action consent. | C4 |
| “I teach” personal annotation | Gives an older beginner an expert role without modifying Hebrew mastery. | Annotation is treated as a scored correction or shared by default. | C4 |
| Post-pilot attendance dots | Clearly understood as attendance only and never compared as totals. | Learner interprets dots as performance or feels observed. | C4 |

Any pilot result is an `n=1` observation, not general learning evidence.

## Implementation order

1. **Comprehension and contrast:** simplified Guided Today, plain copy, help,
   actionable empty states, dark-theme AA checks.
2. **First success:** three-word pre-account lesson, reversible defaults and
   persisted text scale.
3. **Learning path:** deterministic daily planner, reviewed curriculum,
   personalised practice, mistake recovery and sound-first alphabet track.
4. **Visual system:** confusability-audited word art and six Israel-region
   scenes, with progressive hint reveal and reduced-motion support.
5. **Motivation:** attendance/XP separated from mastery, rest grace, accessible
   celebrations and a meaningful-session summary.
6. **Only after the pilot:** evaluate the private companion experiments above.

## Primary and research sources

### Product documentation

- Duolingo: [How to learn on Duolingo](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/),
  [practice options](https://blog.duolingo.com/ways-to-practice-in-duolingo/),
  [Energy](https://blog.duolingo.com/duolingo-energy/),
  [time spent learning](https://blog.duolingo.com/time-spent-learning-well/),
  and [intermediate mini-units](https://blog.duolingo.com/intermediate-mini-units/).
- Drops: [product overview](https://www.languagedrops.com/) and
  [Dojo review](https://support.languagedrops.com/hc/en-us/articles/19334419328275-Dojo-Feature-What-is-it-and-How-to-Review-Words).
- Busuu: [product model](https://help.busuu.com/hc/en-us/articles/15936615354641-What-is-Busuu)
  and [Study Plan](https://help.busuu.com/hc/en-us/articles/16097312171153-What-s-a-Study-Plan-How-do-I-make-one).
- Memrise: [current product direction](https://www.memrise.com/blog/major-update-a-new-version-of-the-app-is-coming)
  and [about](https://www.memrise.com/about).
- Open language exchange models reviewed but not adopted:
  [HelloTalk](https://www.hellotalk.com/en/) and [Tandem](https://tandem.net/).

### Usability and platform guidance

- Nielsen Norman Group:
  [technical words and older users](https://www.nngroup.com/articles/define-techy-words-old-users/),
  [senior usability](https://www.nngroup.com/articles/usability-for-senior-citizens/),
  and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
- Android:
  [accessibility defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)
  and [scalable content](https://developer.android.com/develop/ui/compose/accessibility/scalable-content).
- W3C: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

These sources describe product behavior and design guidance. Ivrit Sheli's own
tests, accessibility checks and pilot evidence remain the acceptance authority.
