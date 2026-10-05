/**
 * CLI workbench data. Files and code snippets shown by the
 * homepage CliInAction IDE-style panel.
 *
 * SOURCE OF TRUTH: this file is the canonical reference for the
 * `saas-starter` template structure as it appears in the marketing
 * storyboard. The actual template repository lives in a separate
 * codebase (`apps/cli` clones from a remote registry); we cannot
 * read its filesystem from here. When the template changes (new
 * top-level file, renamed manifest, different dev script), update
 * this file in lockstep and verify the workbench still tells a
 * truthful story.
 *
 * Keep the lists short. The workbench column is dense; aim for 8-10
 * visible nodes in the Explorer and 12-15 lines of `package.json`
 * in the Editor. Over-stuffing the panel makes the animated reveal
 * unreadable.
 */

export type ExplorerNode = {
  /** Path segment relative to the template root. */
  name: string
  /** Optional sub-nodes; absence means a leaf file. */
  children?: ReadonlyArray<ExplorerNode>
}

/**
 * Top-level layout of the cloned `deessejs/saas-template` repo as
 * it appears locally after `deessejs init saas-starter`. The CLI
 * derives the local directory name from the slug (see
 * `apps/cli/src/commands/init.ts:53`), so `init saas-starter`
 * produces `./saas-starter/` even though the GitHub repo is
 * called `saas-template`.
 *
 * Reflects the real monorepo layout: Turborepo with `apps/`
 * (app / docs / web) and `packages/` (api / auth / cookies /
 * database / email / env / eslint-config / typescript-config /
 * ui / utils), plus the root `AGENTS.md`, `README.md`,
 * `package.json` (named `next-monorepo`), `pnpm-workspace.yaml`
 * and `turbo.json`.
 *
 * Order matches the order nodes are revealed by the workbench
 * animation.
 */
export const SAAS_STARTER_FILES: ReadonlyArray<ExplorerNode> = [
  {
    name: "saas-starter",
    children: [
      { name: "AGENTS.md" },
      { name: "README.md" },
      { name: "package.json" },
      {
        name: "apps",
        children: [
          { name: "app" },
          { name: "docs" },
          { name: "web" },
        ],
      },
      {
        name: "packages",
        children: [
          { name: "api" },
          { name: "auth" },
          { name: "database" },
          { name: "ui" },
          { name: "utils" },
        ],
      },
      { name: "pnpm-workspace.yaml" },
      { name: "turbo.json" },
    ],
  },
]

/**
 * Snippet of `saas-starter/package.json` rendered in the Editor
 * pane. Truncated to the most informative subset; the `...` line
 * is intentional and signals "more lines exist, not shown".
 *
 * `pnpm dev` is the actual command the template runs after install.
 * `init` itself only clones + installs, never starts a server.
 * The animation surfaces both commands explicitly to avoid the
 * misconception that one command does everything.
 */
export const SAAS_STARTER_PACKAGE_JSON = `{
  "name": "next-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "packageManager": "pnpm@9.12.0"
}`

/**
 * Snippet of `saas-starter/AGENTS.md` rendered in the Editor pane
 * when the user clicks the AGENTS.md tab. AGENTS.md is part of the
 * template's agent-facing surface (the homepage CodingAgents section
 * advertises this convention), so the snippet illustrates the shape
 * of instructions a coding agent would read on a fresh clone.
 *
 * Kept short on purpose: the editor pane is dense; 6-8 lines fit
 * comfortably at the panel's actual width.
 */
export const SAAS_STARTER_AGENTS_MD = `# AGENTS.md

Branch from staging. PRs target staging, not main.
Better-Auth is the auth layer. See docs.better-auth.com.
Run pnpm test before pushing.
`

/**
 * Files exposed as Editor tabs. Order is the order tabs render.
 * `package.json` is the active tab by default. It is the file the
 * workbench opens first because the dev script (`pnpm dev`) is
 * visible there.
 *
 * `lang` drives Shiki highlighting on the server side. Use
 * markdown for `.md` files; typescript / json otherwise.
 */
export const EDITOR_TABS = [
  { id: "package.json", label: "package.json", lang: "json" },
  { id: "AGENTS.md", label: "AGENTS.md", lang: "markdown" },
] as const

export type EditorTabId = (typeof EDITOR_TABS)[number]["id"]

/** Map a tab id to the snippet shown when it is active. */
export const EDITOR_TAB_CONTENT: Record<EditorTabId, string> = {
  "package.json": SAAS_STARTER_PACKAGE_JSON,
  "AGENTS.md": SAAS_STARTER_AGENTS_MD,
}

/** Map a tab id to the Shiki language identifier. */
export const EDITOR_TAB_LANG: Record<EditorTabId, string> = {
  "package.json": "json",
  "AGENTS.md": "markdown",
}

/**
 * Default `deessejs init saas-starter` output lines, matching the
 * spinners in `apps/cli/src/commands/init.ts`: clone, detect
 * package manager, install dependencies. Kept short so each fits
 * on one terminal row.
 *
 * `Installed 487 packages` was previously in this array. That
 * exact count is not emitted by `init.ts` (the CLI only prints
 * `Dependencies installed` on success). The marketing demo now
 * uses the CLI's actual success line.
 *
 * Callers can override the lines entirely via the `terminalLines`
 * prop on `<CliWorkbenchDemo>` / `<CliWorkbench>`. The /cli page
 * does so to render the full real `init.ts` output (with
 * `cd <dir>` and `pnpm dev`) for a truthful demo.
 */
export const DEFAULT_INIT_OUTPUT_LINES = [
  "✔ Cloned into ./saas-starter",
  "✔ Detected package manager: pnpm",
  "✔ Dependencies installed",
] as const

/**
 * `deessejs info saas-starter` is the post-init inspection
 * command (see `apps/cli/src/commands/info.ts`). The animation
 * shows it as a separate command. `init` does not start the
 * server. `pnpm dev` is the conventional Next.js dev script the
 * template exposes via its `package.json`.
 */
export const DEFAULT_DEV_OUTPUT_LINE =
  "$ pnpm dev"
