import { z } from "zod"

/**
 * Closed-list discriminator for the `template.type` field of
 * `deesse-template.json` (the registry-side descriptor) and the legacy
 * `template:type` field of the API response payload.
 *
 * Values use the `<prefix>:<kind>` shape (`template:app`) per
 * ADR-032 §`type`. The 7 values are exhaustive for the foreseeable
 * registry surface; inventing a new value (e.g. `template:blog`)
 * fails the Zod enum at parse time. New values require an ADR per
 * ADR-036 §2 (semver-major bump because closed-enum extension is a
 * breaking change for clients that map values to fixed routes).
 *
 * The CLI semantics per value:
 *   - `template:app`       — used by `deessejs init <slug>` (full project clone, deployable)
 *   - `template:package`   — used by `deessejs add <slug>` (feature overlay)
 *   - `template:cli`       — used by `deessejs init <slug>` (CLI project)
 *   - `template:mobile`    — used by `deessejs init <slug>` (mobile app)
 *   - `template:desktop`   — used by `deessejs init <slug>` (desktop app)
 *   - `template:agent`     — used by `deessejs init <slug>` (AI agent)
 *   - `template:landing`   — used by `deessejs init <slug>` (landing page)
 *   - `template:starter`   — used by `deessejs init <slug>` (starter repo to rename)
 *
 * `deessejs init` refuses any non-`template:app` value with `parse_error`,
 * and `deessejs add` refuses `template:app` symmetrically. The CLI
 * enforces the routing; the schema is the authoritative closed list.
 *
 * ## Opt-in new values
 *
 * Per ADR-036 §2.1 (added in this PR), the `TEMPLATE_TYPE` enum is
 * documented as opt-in: adding a new value is a **minor** bump — *not*
 * a major bump as the table in ADR-036 §2 suggests for closed enums.
 * The rationale: the CLI's `init`/`add` routing is exhaustive-by-default
 * (unknown values produce `parse_error`), which is the safe failure
 * mode. Older SDK clients that pattern-match `RegistryFailure._tag`
 * need no source change for the failure variant.
 *
 * Closed enums that do **not** carry this opt-in note
 * (`FILE_TYPE_TEMPLATE`, `LICENSE`) remain major-bump per the
 * default rule.
 *
 * @see ADR-032 §`type` for the per-value documentation.
 * @see ADR-036 §2.1 for the opt-in carve-out.
 * @see ADR-036 §5 for the closed-enum procedure.
 */
export const TEMPLATE_TYPE = z.enum([
  "template:app",
  "template:package",
  "template:cli",
  "template:mobile",
  "template:desktop",
  "template:agent",
  "template:landing",
  "template:starter",
])

export type TemplateType = z.infer<typeof TEMPLATE_TYPE>
