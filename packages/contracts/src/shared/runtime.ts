import { z } from "zod"

/**
 * Runtime identifier for a template or block.
 *
 * Initially modeled as a free-form string (`z.string()`) because
 * ADR-032 and the RFCS do not pin a closed list of runtimes. Closed
 * enums for runtime would force an ADR every time a new framework
 * joins (e.g. Solid, Qwik) and would couple the registry to a
 * moving ecosystem. The contract accepts any lowercase kebab-case
 * identifier that matches a permissive pattern.
 *
 * Authors should use a single canonical name per runtime
 * (`nextjs`, `hono`, `nuxt`, `sveltekit`, `tanstack-start`, `astro`,
 * `remix`, `node`). The CLI does not enforce a list; it uses the
 * value to look up peer-dependency hints and lint rules.
 *
 * @see ADR-032 §`requires.runtime` for the runtime gate semantics.
 * @see ADR-036 §2 (the `runtime` enum is open on purpose; closing it
 *      later is a major bump).
 */
export const RUNTIME = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/, {
    message:
      "runtime must be a lowercase kebab-case identifier (e.g. nextjs, hono)",
  })

export type Runtime = z.infer<typeof RUNTIME>
