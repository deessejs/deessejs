/**
 * Static README snapshots for the templates registry.
 *
 * Why this module exists:
 *   The /templates/[template_slug] detail page renders the README
 *   of each GitHub repo. The previous design fetched the README
 *   live from `https://api.github.com/repos/{owner}/{repo}/readme`
 *   at runtime via `enrich()`. That had two problems: (a) a transient
 *   GitHub outage would erase the README from the public site, and
 *   (b) the runtime cost of `enrich()` made the page impossible
 *   to render statically.
 *
 *   This module ships the READMEs in the repository as literal
 *   strings via a generated TS module (`readmes.generated.ts`). The
 *   generation step runs at `prebuild` and the generated file is
 *   committed, so consumers never need to invoke it themselves.
 *
 * Refresh workflow:
 *   1. Run `pnpm refresh-template-readmes` (root) to overwrite the
 *      `.md` snapshots in `readmes/{slug}.md` from GitHub.
 *   2. Run `pnpm --filter @workspace/api generate-readmes` to
 *      regenerate `readmes.generated.ts`.
 *   3. Commit both diffs in the next PR.
 *
 * Adding a template:
 *   1. Add the slug to `templates.ts`.
 *   2. Create `readmes/{slug}.md` with at least a one-line overview.
 *   3. Run `pnpm --filter @workspace/api generate-readmes`.
 *
 * If a snapshot is missing for a known slug, the loader throws at
 * module-load time. "Registry empty" is never the answer — a missing
 * README is a build-time error.
 */
import { TEMPLATES, type RegistryEntry } from "../templates.js"
import type { TemplateV1 } from "@workspace/contracts/v1"
import { TEMPLATE_READMES } from "./readmes.generated.js"

/**
 * Decorate the registry with versioned README snapshots. Each
 * entry gets its `readme` field populated from the generated
 * lookup table at module-load time.
 *
 * Validation: an unknown slug in the registry is a code error and
 * throws at startup. A missing snapshot for a known slug is the
 * same — caught by `prebuild` so a forgotten refresh fails the
 * build before any artifact ships.
 */
export const TEMPLATES_WITH_READMES: ReadonlyArray<TemplateV1> = (
  TEMPLATES as ReadonlyArray<RegistryEntry>
).map((entry) => {
  const readme = TEMPLATE_READMES[entry.slug]
  if (typeof readme !== "string" || readme.length === 0) {
    throw new Error(
      `[templates] missing README snapshot for slug "${entry.slug}". ` +
        `Run \`pnpm refresh-template-readmes --slug=${entry.slug}\` ` +
        `and \`pnpm --filter @workspace/api generate-readmes\`, then commit.`,
    )
  }
  return { ...entry, readme }
})

/**
 * Look up a single template by slug. Returns the decorated
 * record (with `readme` populated from the snapshot).
 */
export const findTemplateWithReadme = (slug: string): TemplateV1 | undefined =>
  TEMPLATES_WITH_READMES.find((t) => t.slug === slug)
