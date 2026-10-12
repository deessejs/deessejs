/**
 * Refresh the versioned template README snapshots in
 * `packages/api/src/templates/readmes/{slug}.md`.
 *
 * Usage:
 *   pnpm refresh-template-readmes            # all slugs
 *   pnpm refresh-template-readmes --slug=X  # one slug
 *
 * What it does:
 *   For each entry in `packages/api/src/templates.ts`, fetches
 *   the README from the upstream GitHub repo at the default branch
 *   (or `master` if the repo's default branch is empty) and writes
 *   it into the matching snapshot file.
 *
 * Why it exists:
 *   The /templates/[template_slug] detail page renders READMEs
 *   from these snapshots — no runtime network calls. The refresh
 *   is an explicit developer action tied to a release. The build
 *   pipeline does not call this script, so a CI run cannot
 *   silently bake new content into the artifact. Refreshing is
 *   opt-in, and the resulting diff is reviewed in the next PR.
 *
 * Authentication:
 *   Reads `GITHUB_TOKEN` from the environment. Anonymous requests
 *   work but are rate-limited (60 req/h per IP). With a token, the
 *   budget is 5000 req/h.
 *
 * Failure semantics:
 *   On any failure (missing file upstream, 4xx, 5xx, timeout) the
 *   script logs the error and exits non-zero — leaving existing
 *   snapshots untouched. Partial success is not supported; the
 *   next PR should run the refresh again.
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { TEMPLATES } from "../packages/api/src/templates.ts"

type FetchResult = { slug: string; ok: true } | { slug: string; ok: false; error: string }

const HERE = dirname(fileURLToPath(import.meta.url))
const README_DIR = join(HERE, "..", "packages", "api", "src", "templates", "readmes")

const token = process.env.GITHUB_TOKEN
const headers: Record<string, string> = {
  Accept: "application/vnd.github.raw+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "deessejs-refresh-template-readmes",
}
if (token) headers.Authorization = `Bearer ${token}`

const fetchReadme = async (
  owner: string,
  repo: string,
): Promise<{ status: number; body: string }> => {
  const url = `https://api.github.com/repos/${owner}/${repo}/readme`
  const response = await fetch(url, { headers })
  return { status: response.status, body: response.ok ? await response.text() : "" }
}

const refreshOne = async (
  slug: string,
  owner: string,
  repo: string,
): Promise<FetchResult> => {
  try {
    const { status, body } = await fetchReadme(owner, repo)
    if (status === 200 && body.length > 0) {
      writeFileSync(join(README_DIR, `${slug}.md`), body, "utf8")
      console.log(`[refresh] ${slug}: ok (${body.length} bytes)`)
      return { slug, ok: true }
    }
    return { slug, ok: false, error: `upstream returned ${status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { slug, ok: false, error: msg }
  }
}

const slugArg = process.argv
  .find((a) => a.startsWith("--slug="))
  ?.slice("--slug=".length)

const targets = TEMPLATES.filter((t) => !slugArg || t.slug === slugArg)

if (targets.length === 0) {
  console.error(`[refresh] unknown slug: ${slugArg}`)
  process.exit(1)
}

const results: Array<FetchResult> = []
for (const t of targets) {
  results.push(await refreshOne(t.slug, t.owner, t.repo))
}

const failures = results.filter((r) => !r.ok)
if (failures.length > 0) {
  console.error("[refresh] failed:")
  for (const f of failures) {
    console.error(`  - ${f.slug}: ${"error" in f ? f.error : "?"}`)
  }
  process.exit(1)
}

console.log(`[refresh] ${results.length} slug(s) updated`)
