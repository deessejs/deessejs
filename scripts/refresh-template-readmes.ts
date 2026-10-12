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
 * Failure semantics — transactional:
 *   The script collects every README into memory first, then
 *   verifies all fetches succeeded, then writes all files. A
 *   single failure aborts the run BEFORE any snapshot is touched;
 *   the existing snapshots remain exactly as they were. The
 *   previous implementation wrote each file as it was fetched,
 *   which left the registry in a partial state on any failure
 *   after the first success — contradicting the "leave existing
 *   snapshots untouched" promise. A request timeout (default
 *   15s per slug) bounds each fetch so a hung socket cannot
 *   stall the run indefinitely.
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { TEMPLATES } from "../packages/api/src/templates.ts"

type FetchResult =
  | { slug: string; ok: true; body: string }
  | { slug: string; ok: false; error: string }

const HERE = dirname(fileURLToPath(import.meta.url))
const README_DIR = join(
  HERE,
  "..",
  "packages",
  "api",
  "src",
  "templates",
  "readmes",
)

const REQUEST_TIMEOUT_MS = 15_000

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
  // `fetch` is now built into Node 22+. The AbortController
  // bounds the request so a hung socket cannot stall the run.
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error("request timeout")),
    REQUEST_TIMEOUT_MS,
  )
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    return {
      status: response.status,
      body: response.ok ? await response.text() : "",
    }
  } finally {
    clearTimeout(timer)
  }
}

const fetchOne = async (
  slug: string,
  owner: string,
  repo: string,
): Promise<FetchResult> => {
  try {
    const { status, body } = await fetchReadme(owner, repo)
    if (status === 200 && body.length > 0) {
      return { slug, ok: true, body }
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

// Phase 1 — collect every README into memory. No file is
// written yet; an error here is the "no partial snapshot"
// guarantee.
const collected: Array<FetchResult> = []
for (const t of targets) {
  console.log(`[refresh] fetching ${t.slug}…`)
  collected.push(await fetchOne(t.slug, t.owner, t.repo))
}

const failures = collected.filter((r): r is Extract<FetchResult, { ok: false }> => !r.ok)

// Phase 2 — abort cleanly if any fetch failed. Existing
// snapshots stay on disk, untouched.
if (failures.length > 0) {
  console.error("[refresh] failed (no snapshots were modified):")
  for (const f of failures) {
    console.error(`  - ${f.slug}: ${f.error}`)
  }
  process.exit(1)
}

// Phase 3 — all fetches succeeded; commit the writes.
const successes = collected.filter(
  (r): r is Extract<FetchResult, { ok: true }> => r.ok,
)
for (const r of successes) {
  writeFileSync(join(README_DIR, `${r.slug}.md`), r.body, "utf8")
  console.log(`[refresh] ${r.slug}: ok (${r.body.length} bytes)`)
}

console.log(`[refresh] ${successes.length} slug(s) updated`)
