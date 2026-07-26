# Ivrit Sheli collaboration guide

## Product direction

Ivrit Sheli should feel like a warm, surprising journey through living Hebrew,
not a generic dashboard with vocabulary attached. Build for three real
experiences:

- **Guided** helps a complete beginner succeed without explanation.
- **Explorer** supports independent learners who want choices and context.
- **Experienced** exposes depth, speed and advanced tools without visual noise.

The product may be playful, illustrated, cinematic and emotionally expressive.
Use Israel-wide places, everyday situations, sound, motion, friendly characters,
small discoveries and clear celebrations when they improve learning. Avoid
copying competitor layouts, generic purple AI styling or decorative complexity
that hides the next action.

## Creative permission

Within an approved task, take initiative on reversible local work. You may:

- propose two or three genuinely different visual directions and select the
  strongest with a short rationale;
- create original interaction patterns, illustrations, animations, narrative
  transitions and prototypes;
- simplify or replace an existing visual treatment when evidence shows that a
  bolder alternative is clearer or more memorable;
- use maintained libraries or external services when they materially improve
  the experience and their cost, licence and fallback are understood;
- make reasonable product decisions without pausing for every small choice.

Prefer one polished vertical slice over many unfinished ideas. Mark experiments
as experiments, measure them with real learners and remove them when they add
confusion.

## Trust without fear

Privacy is a quiet foundation, not the main story or a reason to avoid useful
features. Apply controls in proportion to risk:

- Ordinary preferences, anonymous product telemetry and non-sensitive learning
  content may use simple, transparent defaults.
- Account identity, personal notes, recordings, exports and cross-device
  progress need clear ownership, isolation and deletion controls.
- Credentials, provider tokens and secrets always remain protected and outside
  source control.
- External AI, speech or analytics may be offered when the learner understands
  what is sent, the feature has a useful fallback and costs are bounded.

Do not add consent friction to harmless local actions. Never weaken
authentication, tenant isolation, secret handling or truthful user-facing
claims in the name of convenience.

## Engineering workflow

Inspect the repository and current diff first. Work in small complete slices:
understand, implement, verify, review and document. Preserve existing behavior
unless the change intentionally replaces it. Do not use fake controls,
placeholder integrations or mocks presented as production evidence.

Use strict TypeScript, typed Python, accessible semantic UI, trilingual copy and
correct Hebrew RTL. Design loading, empty, error, success, offline and degraded
states. Run the relevant lint, typecheck, tests, accessibility checks and
production build before calling a slice complete. Report verified, inferred and
unverified results separately.

Public contest materials are frozen until the OpenAI Build Week winner
announcement. Keep v2.8 work local and private until that restriction expires.
