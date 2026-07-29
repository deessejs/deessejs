---
title: Release process
last_updated: 2026-06-17
owner: release manager
status: active
---

# Release process

What we do when we ship a version of DeesseJS. Covers the full path from "tech lead declares done" to "tag is published."

## Versioning scheme

We follow **strict SemVer** for the template itself (the git repo + any npm artifact it produces):

- `MAJOR.MINOR.PATCH`
- `MAJOR` is 0 until commercial GA. v1.0.0 is the first version we sell.
- `MINOR` increments when a feature milestone (M1, M2, ..., M8) ships.
- `PATCH` increments for infrastructure, dependencies, and tooling releases (v0.0.x).
- Pre-1.0, every release is allowed to be breaking. Pre-1.0, we do not promise API stability to buyers.

The SemVer decision and the ratchet-start decision (v0.0.1 = `create-next-app` baseline) are both locked in `architecture/10-decisions/`.

## Release types

We ship three kinds of releases. Each has a different gate.

### Type 1: Patch release (v0.0.x)

**What it is:** Infrastructure, dependencies, tooling, the bootstrap (Drizzle wired, Better Auth wired, modular folder structure, delete tests, CI, deploy, etc.).

**Gate:** Tech lead alone. No review needed unless the patch touches a public surface.

**Cadence:** When the increment is done, not on a timer. A patch can take 2 hours or 2 days.

**Artifacts:**
- Version bump in `package.json` and any version files.
- Changelog entry.
- Git tag (`v0.0.X`).
- GitHub release with notes (lightweight; one paragraph per patch).

### Type 2: Minor release (v0.x.0)

**What it is:** A feature milestone from the build roadmap (M1: auth+orgs, M2: RBAC, M3: billing, ..., M8: QA pass).

**Gate:** Tech lead + release manager. Both must sign off. Founder is informed but does not gate.

**Cadence:** When the milestone is done. A milestone can take 1–3 weeks.

**Artifacts:**
- Version bump.
- Changelog entry summarizing the milestone (longer than a patch — list the new features, the new env vars, the breaking changes).
- Git tag.
- GitHub release with notes.
- Update to `architecture/` docs (the delta for this milestone is documented in the relevant `0X-...` folder).
- Demo update if the milestone is buyer-facing (M3 billing → demo shows the new billing flow).

### Type 3: Major release (v1.0.0, future v2.0.0)

**What it is:** A commercial milestone. v1.0.0 = GA. v2.0.0 = post-launch breaking change.

**Gate:** Tripartite — founder/PM + tech lead + release manager. All three must sign off. Any of the three can veto.

**Cadence:** v1.0.0 is fixed by the build roadmap. v2.0.0 is post-launch.

**Artifacts:**
- Everything from a minor release.
- Landing page, pricing, checkout, license delivery wired and tested.
- Demo app live and buyer-facing.
- Beta feedback incorporated.
- Public launch comms (Product Hunt, Indie Hackers, etc.).

## The release flow (for any type)

1. **Tech lead declares done.** All delete tests green, ADRs at status `Accepted` for the changes, env-vars documented in `architecture/07-deployment/env-vars.md`, the archi delta written.
2. **Release manager picks up.** Generates the changelog from commits (using `git log` + Conventional Commits parsing). Updates `CHANGELOG.md`. Bumps the version (`npm version` or equivalent).
3. **Gate runs.** Per release type (above).
4. **Tag and release.** `git tag v<X.Y.Z>`, push tag, GitHub release published.
5. **Post-release.** The release manager notes any friction in the process. The friction is reviewed at the next quarterly process review.

## Version progression (planned)

This is the planned path from today to v1.0.0. Versions are added as we go; this list grows as the project progresses.

| Version | Type | Content | Marked by |
|---|---|---|---|
| v0.0.1 | Patch | `create-next-app` baseline | "On existe" |
| v0.0.2 | Patch | Drizzle wired (config, no schema) | "La DB parle TypeScript" |
| v0.0.3 | Patch | Better Auth wired (sessions only) | "On a des users" |
| v0.0.4 | Patch | Tailwind + shadcn (UI floor) | "On a un design system" |
| v0.0.5 | Patch | Env-var system (Zod-validated) | "Les secrets sont gérés" |
| v0.0.6 | Patch | `apps/template/apps/{web,cli}` + `apps/template/packages/*` structure + 1 example feature | "Le contrat modulaire existe" |
| v0.0.7 | Patch | Delete-test infrastructure | "Le contrat est enforced" |
| v0.0.8 | Patch | CI (lint, typecheck, test, build) | "On peut merger en confiance" |
| v0.0.9 | Patch | Deploy to Vercel working | "On peut shipper" |
| v0.1.0 | Minor | M0 done (plateforme complète) | "On a un produit, pas encore vendable" |
| v0.2.0 | Minor | M1 (auth + orgs) | "On a des orgs" |
| v0.3.0 | Minor | M2 (RBAC) | "On a des rôles" |
| v0.4.0 | Minor | M3 (billing) | "On peut prendre de l'argent" |
| v0.5.0 | Minor | M4 (operational features) | "Le wizard, les mails, les notifs" |
| v0.6.0 | Minor | M5 (API + SDK + CLI) | "L'écosystème externe" |
| v0.7.0 | Minor | M6 (AI primitives) | "L'AI est wired" |
| v0.8.0 | Minor | M7 (landing + sales + démo) | "On est en preview publique" |
| v0.9.0 | Minor | M8 (QA pass + beta externe) | "On est en beta" |
| v1.0.0 | Major | Commercial GA | "On vend" |

## Cadence

- **Patch releases:** when the increment is done. No fixed schedule.
- **Minor releases:** when the milestone is done. No fixed schedule.
- **Major releases:** fixed by the build roadmap for v1.0.0. v2.0.0 is post-launch.

There is **no "twice a month" or "every Friday" rule.** We ship when there is something worth shipping, not on a calendar. The discipline is in the gate, not the cadence.

## Changelog format

Follow [Keep a Changelog](https://keepachangelog.com/) conventions. Sections per release:

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- <new feature or surface>

### Changed
- <change to existing behavior>

### Deprecated
- <soon-to-be-removed feature>

### Removed
- <removed feature>

### Fixed
- <bug fix>

### Security
- <security fix or audit>
```

For pre-1.0 versions, **Breaking changes** is a separate section called out explicitly:

```
### Breaking
- <what was broken, and the migration path>
```

## Related

- [`role-definitions.md`](./role-definitions.md) — who owns each step of this process.
- [`../architecture/10-decisions/0010-v001-create-next-app-baseline.md`](../architecture/10-decisions/0010-v001-create-next-app-baseline.md) — the ratchet-start decision.
- [`../architecture/10-decisions/README.md`](../architecture/10-decisions/README.md) — the ADR index, conventions, and template.
- [`../product/build-roadmap.md`](../product/build-roadmap.md) — the milestone definitions.
- `architecture/07-deployment/ci-cd.md` (to be written) — the CI pipeline that runs the delete tests.

## Changelog

- 2026-06-17: Initial version (covers v0.0.1 → v1.0.0 release strategy, the three release types, the version progression table).
