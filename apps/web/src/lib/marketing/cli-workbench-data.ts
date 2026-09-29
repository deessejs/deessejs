/**
 * CLI workbench data — files and code snippets shown by the
 * homepage CliInAction IDE-style panel.
 *
 * SOURCE OF TRUTH: this file is the canonical reference for the
 * `saas-starter` template structure as it appears in the marketing
 * storyboard. The actual template repository lives in a separate
 * codebase (`apps/cli` clones from a remote registry) — we cannot
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
 * Top-level layout of the `saas-starter` template as it appears
 * after a successful `deessejs init saas-starter`. Order matches
 * the order nodes are revealed by the workbench animation.
 */
export const SAAS_STARTER_FILES: ReadonlyArray<ExplorerNode> = [
  {
    name: "saas-starter",
    children: [
      { name: "package.json" },
      { name: "AGENTS.md" },
      { name: "README.md" },
      {
        name: "src",
        children: [
          {
            name: "app",
            children: [
              { name: "layout.tsx" },
              { name: "page.tsx" },
            ],
          },
          {
            name: "lib",
            children: [
              { name: "auth.ts" },
              { name: "db.ts" },
            ],
          },
        ],
      },
      { name: "public" },
    ],
  },
]

/**
 * Snippet of `saas-starter/package.json` rendered in the Editor
 * pane. Truncated to the most informative subset; the `...` line
 * is intentional and signals "more lines exist, not shown".
 *
 * `pnpm dev` is the actual command the template runs after install
 * — `init` itself only clones + installs, never starts a server.
 * The animation surfaces both commands explicitly to avoid the
 * misconception that one command does everything.
 */
export const SAAS_STARTER_PACKAGE_JSON = `{
  "name": "saas-starter",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.2.0",
    "react": "19.2.0",
    ...
  }
}`

/**
 * Three real output lines from `deessejs init saas-starter`,
 * matching the spinners in `apps/cli/src/commands/init.ts`:
 * clone → detect package manager → install dependencies.
 * Kept short so each fits on one terminal row.
 */
export const INIT_OUTPUT_LINES = [
  "✔ Cloned into ./saas-starter",
  "✔ Detected package manager: pnpm",
  "✔ Installed 487 packages",
] as const

/**
 * `deessejs info saas-starter` is the post-init inspection
 * command (see `apps/cli/src/commands/info.ts`). The animation
 * shows it as a separate command — `init` does not start the
 * server. `pnpm dev` is the conventional Next.js dev script the
 * template exposes via its `package.json`.
 */
export const DEV_OUTPUT_LINE = "▲ Next.js ready on http://localhost:3000"
