---
title: Role definitions
last_updated: 2026-06-17
---

# Role definitions

The three roles that make DeesseJS ship. Each role has a clear scope, clear interfaces with the others, and clear veto power on its own domain.

This is a living document. New roles may be added as the team grows.

## Founder / PM

**Owns:** Product, strategy, pricing, positioning, buyer voice, distribution.

**Scope of decisions (sole owner):**
- Feature scope (what's in v1, what's in v2, what's never).
- Pricing tiers, gates, renewal terms.
- Marketing copy, landing page, brand voice.
- Buyer-voice research, competitive teardowns.
- Distribution channels (Product Hunt, Indie Hackers, X).

**Interfaces:**
- Hands off to **tech lead** via `product/*.md` (the spec) and `product/open-questions.md` (decisions pending).
- Hands off to **release manager** via `product/build-roadmap.md` (milestone plan) and the explicit "GA ready" declaration for v1.0.0.

**Veto power:** On anything that breaks the buyer promise (the "Apple" positioning). "No half-built features" is non-negotiable.

## Tech lead

**Owns:** Architecture, code review, technical decisions, codebase health.

**Scope of decisions (sole owner):**
- Stack choices (within the product spec's locked decisions).
- Module structure and the modular contract.
- ADRs in `architecture/10-decisions/`.
- Code review approval.
- The delete-test discipline.

**Interfaces:**
- Consumes from **founder/PM** via the product spec.
- Hands off to **release manager** via the "M<n> done" declaration: delete tests green, ADRs at `Accepted`, env-vars documented, the archi delta written.
- Cross-references **release manager** on env-vars and ADRs (these cross the release boundary).

**Veto power:** On any release where the delete tests are red, or where the ADRs are not current.

## Release manager

**Owns:** Versioning, release process, changelog, the go/no-ship gate.

**Scope of decisions (sole owner):**
- The version number (per the SemVer scheme in `release-process.md`).
- The changelog content and format.
- The tag and GitHub release.
- The release gate (validating per release type).
- Quarterly review of the process itself.

**Interfaces:**
- Consumes from **tech lead** via the "M<n> done" declaration.
- Consumes from **founder/PM** via the "GA ready" declaration (for v1.0.0).
- Publishes the artifact (tag, release, changelog) that everyone else consumes.

**Veto power:** On any release where the gate criteria are not met. The release manager can stop a release, even if tech lead and founder both signed off.

## How the three roles collaborate

| Activity | Founder | Tech lead | Release manager |
|---|---|---|---|
| Define a feature | Decides | Implements | — |
| Lock a tech choice | — | Decides + ADR | — |
| Approve a PR | — | Decides | — |
| Ship a v0.0.x release | Informed | Signs off | Ships |
| Ship a v0.x.0 release | Informed | Signs off | Ships |
| Ship v1.0.0 | Signs off | Signs off | Ships |
| Quarterly process review | Participates | Participates | Owns |

The pattern: **founder owns "what", tech lead owns "how", release manager owns "when it is safe to ship".**

## When the team grows

If we add a 4th role (e.g. a designer, a second dev, a security specialist), they fit into one of the existing columns or get a new column. This doc is updated, not extended with side-clauses.

## Related

- [`release-process.md`](./release-process.md) — what each role does at each release type.
- [`../architecture/10-decisions/`](../architecture/10-decisions/) — the tech lead's decision log.
- [`../product/`](../product/) — the founder/PM's domain.

## Changelog

- 2026-06-17: Initial version (three roles: founder/PM, tech lead, release manager).
