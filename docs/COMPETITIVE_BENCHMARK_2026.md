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

## Local candidate implementation status

This snapshot describes the local v2.8 candidate on 2026-07-26. The
labels intentionally separate implementation evidence from release evidence:

- **Code present** means the relevant path was inspected in the current
  worktree.
- **Release verified** means the root release owner has run the complete
  applicable test, accessibility and build gates after the final diff.

The root verification pass is complete for the local code, accessibility,
build, dependency and Docker/PostgreSQL readiness boundaries. It executed 201
backend, 310 Vitest and 25 Playwright cases with no failures. The final 2.8.3
staged package verifier and 294-entry canonical checksum manifest pass; the
reproducible ZIP for historical 2.8.1 checkpoint `c9e2762` also passed clean
extraction, package verification, Compose parsing and external SHA comparison.
Publication still requires the two-real-Google-account check, the mother-pilot
acceptance retest and the OpenAI Build Week winner announcement.

| Research decision now represented in code | Current implementation boundary | Code evidence | Release verification |
|---|---|---|---|
| Teach three words before account or configuration | `PreAccountLesson` presents the first three reviewed starter words one at a time, with meaning choices, retry, an example and optional browser speech. `AuthGate` keeps account, local-mode and demo choices behind completion or an explicit skip. The lesson is intentionally ephemeral: it does not claim saved progress, XP or a scored attempt. | `frontend/src/components/PreAccountLesson.tsx`; `frontend/src/components/AuthGate.tsx` | Verified locally in the 310-test Vitest suite |
| Plain “Before you start” guide | Daily Practice now opens with a trilingual briefing that previews the session's unique concepts, lets the learner hear them, states the goal and provides one start action. Read-only demo status is disclosed before practice begins. | `frontend/src/components/DailyPracticeSession.tsx` | Verified locally in component and browser gates |
| Progressive visual retrieval cue | Retrieval exercises with a supported `visual_id` initially hide the illustration and expose a labelled “Show visual hint” action. Revealing it increments `hints_used`; unsupported or personal concepts do not receive fabricated art. | `frontend/src/components/DailyPracticeSession.tsx`; `backend/src/ivrit_sheli/local_learning_engine.py` | Verified locally in backend and frontend suites |
| Linguistically reviewed reading support | The display ladder uses authored `reading_hints` when available. The legacy state name `partial_niqqud` now means “reviewed cue or full reviewed niqqud,” never deletion by character position. Hint-only remains unpointed until reveal, then uses the reviewed cue or full form; entries without reviewed support remain honestly unpointed. | `frontend/src/learningCore.ts`; `frontend/src/components/LearningCoreJourney.tsx`; `backend/src/ivrit_sheli/learning_core.py` | Verified locally in backend and frontend suites |
| Actionable high-value empty states | An exhausted review queue and an empty progress activity log offer Daily Practice. A filtered word collection offers Clear filters; a genuinely empty collection offers Dictionary. This is a targeted improvement, not yet a claim that every empty state in the product has been audited. | `frontend/src/components/ReviewCard.tsx`; `frontend/src/components/ProgressPanel.tsx`; `frontend/src/components/RegistryPanel.tsx`; `frontend/src/components/LearnPanel.tsx` | Verified locally for the targeted states |
| Larger touch floor on primary learning surfaces | Shared primary/secondary controls and the inspected locale, icon, atlas, dictionary and round-action controls have a 48 px minimum dimension in CSS. | `frontend/src/styles.css` | Verified locally across 390/768/1440 px, keyboard, reduced-motion, dark/light axe and 200% reflow gates |
| Visual association without generic stock art | Seventy-two reviewed concepts now have exact, local SVG scenes with progressive context/meaning/anchor layers. Today selects recommended exact-scene words first and uses deterministic exact backfill only. A private-LAN QA gallery compares all scenes and records a seeded five-second recognition run. | `frontend/src/visuals/a0VisualRecipes.ts`; `frontend/src/components/semantic-scenes/`; `backend/src/ivrit_sheli/visual_spotlight.py` | Verified locally at 390/768/1440 px, light/dark, Hebrew RTL, reduced motion and 200% text reflow; 12-scene mother pilot remains required |

## Adopt

| Decision | Ivrit Sheli implementation | Trace |
|---|---|---|
| Teach before configuration | A new visitor can hear and practise three reviewed Hebrew words before profile, level or account questions. The result is not presented as saved until the learner enters a persistent mode. Guided/A0 remains the default. | U1, U2, C1, C2 |
| One obvious next action | Guided Today answers “What do I do now?” with one large action. Technical evidence remains inspectable behind one disclosure. | U1, C1, C2 |
| A guided path with an exit | Make the linear path the Guided default while Explorer and Experienced retain free navigation. Guided is a starting aid, not a cage. | C1, C2 |
| Plain pre-lesson guide | Daily Practice starts with a short “Before you start” card containing the lesson's words, optional sounds and goal. | C2 |
| Personalised practice node | Insert an explicit practice step selected from SRS urgency, mistakes and reviewed curriculum data; explain the reason in plain language. | C1, C2 |
| Unlimited mistake recovery | Offer a free end-of-session retry of mistakes. Do not block learning after errors. | C2 |
| Unassisted challenge | Offer an optional no-hint attempt as evidence of retrieval, without calling it CEFR certification or global mastery. | C2 |
| Sound-first Hebrew reading track | Teach sound value first and letter name second in a separate alphabet/reading path covering 22 letters and final forms. | C2, C3 |
| Visual retrieval cues | Supported reviewed concepts have distinguishable visual identities; Daily Practice reveals the image progressively as an optional, recorded hint rather than always exposing the answer. | C3 |
| Actionable empty states | The review, progress-activity and word-collection empty states now offer a useful next action. Remaining product surfaces still require an explicit empty-state audit. | U1, C1 |
| Persistent help and reversible actions | Guided mode always exposes labelled Help; risky or confusing actions support cancellation or reversal. | C1 |
| Accessibility floor | Shared and inspected learning controls now use a 48 px CSS floor. Plain labels, readable functional text, large Hebrew with niqqud and 200% reflow remain part of the final accessibility matrix rather than inferred from CSS alone. | U1, C1, P1 |

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

None of the experiments in this section is claimed as implemented or
release-ready in the local v2.8 candidate. In particular, letter tracing,
licensed real-speaker media and an invited companion remain deliberately
deferred; they add acquisition, accessibility, consent or moderation work that
must not be hidden behind a prototype.

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

1. **Locally verified — comprehension:** simplified Guided navigation, plain
   copy, help, dark/light accessibility gates and targeted actionable empty
   states. A complete all-surface empty-state inventory remains future polish.
2. **Locally verified — first success:** interactive
   three-word pre-account lesson and persisted text scale. The pre-account
   lesson remains deliberately unsaved until a persistent mode is chosen.
3. **Locally verified — learning path:** deterministic daily
   planner, reviewed curriculum, personalised practice, mistake recovery,
   sound-first alphabet track and authored `reading_hints`.
4. **Locally verified — visual system:** Israel-region scenes, concept art,
   progressive hint reveal and reduced-motion behavior. A real-learner
   confusability audit remains part of the pilot.
5. **Locally verified — motivation:** attendance/XP separated
   from mastery, rest grace, accessible celebrations and a meaningful-session
   summary.
6. **Deferred until pilot evidence:** tracing, real-speaker media, mnemonic
   experiments, attendance dots and any invited-companion capability.

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
