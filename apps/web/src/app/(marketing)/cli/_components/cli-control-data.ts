/**
 * The three `init` flags the /cli page highlights. The other
 * flags (`--ref`, `--force`, `--json`) are escape hatches not
 * worth a first-visit slot.
 *
 * The `flag` is rendered as a mono label. The `body` explains
 * the practical use. The `command` is the canonical example
 * the visitor copies.
 */
export type CliControlFlag = {
  flag: string
  body: string
  command: string
}

export const CLI_CONTROL_FLAGS: ReadonlyArray<CliControlFlag> = [
  {
    flag: "--dir <path>",
    body: "Override the target directory. Useful when the project lives in a subfolder of a monorepo.",
    command: "deessejs init saas-starter --dir apps/web",
  },
  {
    flag: "--pm <name>",
    body: "Pin a package manager when the auto-detected one is wrong.",
    command: "deessejs init saas-starter --pm bun",
  },
  {
    flag: "--no-install",
    body: "Clone only. Run the install command yourself (offline or in a constrained CI).",
    command: "deessejs init saas-starter --no-install",
  },
]
