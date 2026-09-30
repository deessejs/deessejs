/**
 * `deessejs template` namespace (ADR-034).
 *
 * Public surface of the author-side tooling. Three subcommands:
 *
 *   - `validate` — schema validation of `deesse-template.json`
 *     files. Layer 1 (shape) only in v1; closed-list, cross-item,
 *     and repository layers ship in follow-ups.
 *   - `new` — scaffold a new descriptor from catalogue defaults.
 *     Placeholder until the registry CDN lands (ADR-034 §3).
 *   - `explain` — render field docs from the Zod schema JSDoc.
 *     Placeholder until the JSDoc-on-schema contract lands
 *     (ADR-034 §4).
 *
 * Only `validate` is functional in v1. The other two exit with
 * a structured error so the namespace is honest about what it
 * currently offers.
 */

export { validateCommand } from "./validate.js"
export { newCommand } from "./new.js"
export { explainCommand } from "./explain.js"