/**
 * Open source pillar code snippets - server-only module.
 *
 * Eight TypeScript samples for the open source use case
 * (`/use-cases/open-source`): the four existing clusters
 * (License + changelog, Public registry CLI, Community shapes,
 * Release automation) plus four new "behind the curtain" pillars
 * (Conventional commits, deessejs update, CODEOWNERS routing,
 * Semver bump).
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Snippets are illustrative. Real public API may differ.
 */

export type OpenSourcePillarSlug =
  | "conventional-commits"
  | "deessejs-init"
  | "agents-md"
  | "changeset-release"
  | "license-check"
  | "deessejs-update"
  | "codeowners-route"
  | "semver-bump"

export type OpenSourcePillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type OpenSourcePillarTool = {
  files: ReadonlyArray<OpenSourcePillarSnippet>
}

const conventionalCommitsFile: OpenSourcePillarSnippet = {
  tabName: "conventional-commits.ts",
  lang: "typescript",
  code: `import { parseCommit, formatChangelog } from "@workspace/utils"

export const buildChangelog = (commits: string[]) =>
  formatChangelog(commits.map(parseCommit), { groupBy: "scope" })`,
}

const deessejsInitFile: OpenSourcePillarSnippet = {
  tabName: "deessejs-init.ts",
  lang: "typescript",
  code: `import { scaffold } from "@deessejs/cli"

await scaffold({
  template: "saas-starter",
  ref: "main",
  install: true,
})`,
}

const agentsMdFile: OpenSourcePillarSnippet = {
  tabName: "agents-md.ts",
  lang: "typescript",
  code: `export const agentsMd = [
  "# AGENTS.md",
  "",
  "Branch from staging. PRs target staging, not main.",
  "Better-Auth is the auth layer. Run pnpm test before pushing.",
].join("\\n")`,
}

const changesetReleaseFile: OpenSourcePillarSnippet = {
  tabName: "changeset-release.ts",
  lang: "typescript",
  code: `import { aggregate } from "@changesets/cli"

export const nextRelease = async (cwd: string) => {
  const { bumps, summary } = await aggregate(cwd)
  return { version: summary.newVersion, bumps }
}`,
}

const licenseCheckFile: OpenSourcePillarSnippet = {
  tabName: "license-check.ts",
  lang: "typescript",
  code: `import { readFile } from "node:fs/promises"

export const assertMit = async (cwd: string) => {
  const license = await readFile(cwd + "/LICENSE", "utf8")
  if (!license.startsWith("MIT License")) {
    throw new Error(cwd + " is not MIT-licensed")
  }
}`,
}

const deessejsUpdateFile: OpenSourcePillarSnippet = {
  tabName: "deessejs-update.ts",
  lang: "typescript",
  code: `import { update } from "@deessejs/cli"

await update({
  template: "saas-starter",
  from: "1.4.0",
  to: "1.5.0",
})`,
}

const codeownersRouteFile: OpenSourcePillarSnippet = {
  tabName: "codeowners-route.ts",
  lang: "typescript",
  code: `import { readFile } from "node:fs/promises"

export const ownersFor = async (path: string) => {
  const raw = await readFile(".github/CODEOWNERS", "utf8")
  return parseCodeowners(raw, path)
}`,
}

const semverBumpFile: OpenSourcePillarSnippet = {
  tabName: "semver-bump.ts",
  lang: "typescript",
  code: `import { bumpVersion } from "@workspace/utils"

export const next = (current: string, kind: "major" | "minor" | "patch") =>
  bumpVersion(current, kind, { allowBreaking: kind === "major" })`,
}

export const OPEN_SOURCE_SNIPPETS: Record<OpenSourcePillarSlug, OpenSourcePillarTool> = {
  "conventional-commits": { files: [conventionalCommitsFile] },
  "deessejs-init":        { files: [deessejsInitFile] },
  "agents-md":            { files: [agentsMdFile] },
  "changeset-release":    { files: [changesetReleaseFile] },
  "license-check":        { files: [licenseCheckFile] },
  "deessejs-update":      { files: [deessejsUpdateFile] },
  "codeowners-route":     { files: [codeownersRouteFile] },
  "semver-bump":          { files: [semverBumpFile] },
}
