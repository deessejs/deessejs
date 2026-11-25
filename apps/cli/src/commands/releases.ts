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
  .action(async (slug: string | undefined, options: { json?: boolean; organization?: string }) => {
    const auth = options.organization ? readAuth() : undefined
    if (options.organization && !auth) throw new Error("Sign in with deessejs auth login to list organization releases.")
    const client = auth ? createAuthenticatedORPCClient(auth.access_token) : orpc
    const { releases } = await client.managedReleases.list({ ...(options.organization ? { organizationSlug: options.organization } : {}) })
    const filtered = slug ? releases.filter((release) => release.slug === slug) : releases
    if (options.json) {
      printJson({ releases: filtered })
      return
    }
    if (filtered.length === 0) {
      console.log("No ready managed releases found.")
      return
    }
    for (const release of filtered) {
      console.log(`${pc.bold(release.slug)} ${release.version} ${pc.dim(`${release.kind} · ${release.ownerType}`)}${release.hasPreview ? " · preview" : ""}`)
    }
  })
