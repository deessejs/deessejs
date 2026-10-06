/**
 * CLI install steps - server-only module.
 *
 * Each step is a "tool" entry that feeds the same tab+code pattern
 * used by the homepage Ecosystem section. One file per step: the
 * command followed by its expected terminal output, in a single
 * `bash` source string. Shiki highlights the whole block.
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side; this module never ships in the client JS bundle.
 *
 * Snippets are illustrative. The output mirrors what the CLI
 * actually prints (see `apps/cli/src/commands/init.ts`), so a
 * developer running the commands will see the same shape on
 * their terminal.
 */

export type CliStartSlug = "install" | "list" | "info" | "init"

export type CliStartSnippet = {
  /** Filename shown in the mockup title bar. */
  tabName: string
  /** Shiki language id. */
  lang: "bash"
  /** Terminal-style source: command + expected output. */
  code: string
}

/** A step bundles one or more file snippets. */
export type CliStartTool = {
  files: ReadonlyArray<CliStartSnippet>
}

const installFile: CliStartSnippet = {
  tabName: "terminal",
  lang: "bash",
  code: `$ npm i -g @deessejs/cli
added 1 package in 3s

$ deessejs --version
2.1.0
`,
}

const listFile: CliStartSnippet = {
  tabName: "terminal",
  lang: "bash",
  code: `$ deessejs list
slug                  name                    category       license
eve-starter           Eve Starter             ai             MIT
landing-starter       Landing Starter         marketing      MIT
electron-starter      Electron Starter        desktop        MIT
saas-starter          SaaS Starter            saas           MIT
saas-starter-multi-tenant  SaaS Starter (MT)   saas           MIT

8 templates. Use --category <name> to filter, --json for scripting.
`,
}

const infoFile: CliStartSnippet = {
  tabName: "terminal",
  lang: "bash",
  code: `$ deessejs info saas-starter
slug         saas-starter
name         SaaS Starter
description  Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS.
category     saas
license      MIT
repo         deessejs/saas-template
labels       nextjs, saas, auth, postgres

Install: example will go here.
`,
}

const initFile: CliStartSnippet = {
  tabName: "terminal",
  lang: "bash",
  code: `$ deessejs init saas-starter
Cloning deessejs/saas-template...
Cloned into ./saas-starter (ref: main)
Detected package manager: pnpm
Installing dependencies...
Dependencies installed
Template ready

$ cd saas-starter && pnpm dev
▲ Next.js ready on http://localhost:3000
`,
}

export const CLI_START_SNIPPETS: Record<CliStartSlug, CliStartTool> = {
  install: { files: [installFile] },
  list: { files: [listFile] },
  info: { files: [infoFile] },
  init: { files: [initFile] },
}
