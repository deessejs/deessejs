import { Command } from "commander"
import pc from "picocolors"
import { createAuthenticatedORPCClient, orpc } from "../api/client.js"
import { printJson } from "../output/index.js"
import { readAuth } from "../lib/auth/store/store.js"

export const releasesCommand = new Command("releases")
  .description("List ready managed template and block releases")
  .argument("[slug]", "filter to one template or block slug")
  .option("--organization <slug>", "list releases owned by an organization")
  .option("--json", "JSON output for scripting")
  .option("--verbose", "show human-readable output")
  .action(
    async (
      slug: string | undefined,
      options: { json?: boolean; verbose?: boolean; organization?: string }
    ) => {
      const json = !options.verbose || !!options.json
      try {
        await listManagedReleases(slug, options, json)
      } catch (error) {
        reportReleaseListError(error, json)
      }
    }
  )

async function listManagedReleases(
  slug: string | undefined,
  options: { organization?: string; verbose?: boolean; json?: boolean },
  json: boolean
): Promise<void> {
  const auth = options.organization ? readAuth() : undefined
  if (options.organization && !auth)
    throw new Error(
      "Sign in with deessejs auth login to list organization releases."
    )
  const client = auth ? createAuthenticatedORPCClient(auth.access_token) : orpc
  const input = options.organization
    ? { organizationSlug: options.organization }
    : {}
  const { releases } = await client.managedReleases.list(input)
  const filtered = slug
    ? releases.filter((release) => release.slug === slug)
    : releases
  if (json) return void printJson({ releases: filtered })
  if (filtered.length === 0)
    return void console.log("No ready managed releases found.")
  filtered.forEach((release) => console.log(formatRelease(release)))
}

function formatRelease(release: {
  slug: string
  version: string
  kind: string
  ownerType: string
  hasPreview: boolean
}): string {
  return `${pc.bold(release.slug)} ${release.version} ${pc.dim(`${release.kind} · ${release.ownerType}`)}${release.hasPreview ? " · preview" : ""}`
}

function reportReleaseListError(error: unknown, json: boolean): void {
  const message = error instanceof Error ? error.message : String(error)
  if (json)
    printJson({
      ok: false,
      command: "template releases",
      code: "release_list_failed",
      message,
    })
  else process.stderr.write(`Error: ${message}\n`)
  process.exitCode = 1
}
