/**
 * `deessejs template new <slug>` (ADR-034 §3).
 *
 * Scaffold a new `deesse-template.json` from defaults inferred
 * from the registry catalogue.
 *
 * **Status**: not yet implemented. This file ships as a
 * placeholder so the CLI surface matches ADR-034's commitment.
 * The full implementation depends on:
 *   1. The registry CDN at `registry.deessejs.com` (not yet
 *      shipped) so the CLI can fetch the catalogue.
 *   2. The `mode` computation from ADR-034 §3 — pick the median
 *      `category` / `license` / `labels` from items of the same
 *      `template:type` as the new slug.
 *
 * Until both land, the command exits with a structured error
 * pointing the author at ADR-034. The plan is to land the impl in
 * the same PR that lights up the registry CDN (per the ADR-034
 * rollout note).
 */

import { Command } from "commander"

import { internal } from "../../errors/index.js"

export const newCommand = new Command("new")
  .description(
    "Scaffold a new deesse-template.json from catalogue defaults",
  )
  .argument("<slug>", "template slug (kebab-case, lowercase)")
  .option("--type <type>", "template:type discriminator (template:app, template:package, ...)")
  .action(
  (
    _slug: string,
    _opts: { type?: string },
  ): never => {
    // The arguments are parsed by Commander; we don't read them
    // because the impl is deferred. The placeholders still appear
    // in --help.
    void _slug
    void _opts
    throw internal(
      "deessejs template new is not yet implemented — see ADR-034 §3",
    )
  },
)