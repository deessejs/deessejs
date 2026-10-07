import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { getRegistryClient } from "../registry/client.js"
import { internal } from "../errors/index.js"
import { printJson, printTemplatesTable } from "../output/index.js"
import type { CatalogEntry, RegistryFailure } from "@workspace/registry-client"

/**
 * Exhaustively match on the SDK's `Result` discriminated union.
 *
 * The SDK exports its own `Result<T, E>` (defined in
 * `packages/registry-client/src/types.ts`). It is structurally
 * identical to `@deessejs/fp`'s `Result<T, E>` (both are
 * `{ _tag: "Ok" | "Err" }`) but is a distinct nominal type —
 * TypeScript will not let us feed one into the other's `match`
 * without a conversion. This helper does the discrimination with
 * an exhaustiveness check on the `never` branch, which is the
 * property we actually want from `Result.match`.
 *
 * Once `@workspace/registry-client` re-exports `@deessejs/fp`'s
 * `Result`, this helper can be replaced by `Result.match`.
 */
const matchSdkResult = <T, E, U>(
  result:
    | { readonly _tag: "Ok"; readonly value: T }
    | { readonly _tag: "Err"; readonly error: E },
  handlers: { ok: (value: T) => U; err: (error: E) => U },
): U => {
  switch (result._tag) {
    case "Ok":
      return handlers.ok(result.value)
    case "Err":
      return handlers.err(result.error)
    default: {
      const _exhaustive: never = result
      void _exhaustive
      throw new Error("unreachable")
    }
  }
}

/**
 * `deesse list` — list available templates from the registry.
 *
 * Migrated to use `@workspace/registry-client`. The previous
 * implementation called `fetchTemplates()` against the oRPC API,
 * which returned an enriched V1 shape (with owner/repo/image).
 * The SDK returns `CatalogEntry[]` (slug, title, layer,
 * latestVersion), which is what the catalog screen needs.
 */
export const listCommand = new Command("list")
  .description("List available templates")
  .option("--layer <name>", "filter to a single layer (open-community | pro | enterprise)")
  .option("--json", "JSON output for scripting")
  .action(
    async (opts: {
      layer?: "open-community" | "pro" | "enterprise"
      json?: boolean
    }) => {
      const spinner = opts.json ? null : ora("Fetching templates...").start()

      const client = getRegistryClient()
      const result = await client.listTemplates()
      spinner?.stop()

      const render = (entries: ReadonlyArray<CatalogEntry>): void => {
        const filtered: CatalogEntry[] = opts.layer
          ? entries.filter((t) => t.layer === opts.layer)
          : [...entries]

        if (opts.json) {
          printJson({ templates: filtered })
          return
        }
        if (opts.layer) {
          console.log(pc.dim(`Layer: ${opts.layer}`))
        }
        printTemplatesTable(filtered)
        console.log()
        console.log(
          pc.dim(
            `${filtered.length} template${filtered.length === 1 ? "" : "s"}.` +
              (opts.layer
                ? ""
                : " Use --layer <name> to filter, --json for scripting."),
          ),
        )
      }

      const renderError = (failure: RegistryFailure): never => {
        spinner?.fail("Failed to fetch templates")
        throw internal(`Failed to list templates: ${failure._tag}`)
      }

      matchSdkResult(result, { ok: render, err: renderError })
    },
  )
