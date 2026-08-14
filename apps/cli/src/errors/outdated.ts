import { CliError } from "./index.js"

export const cliOutdated = (
  installed: string,
  minSupported: string,
): CliError =>
  new CliError(
    "cli_outdated",
    `installed CLI version ${installed} is below the minimum supported (${minSupported})`,
    `upgrade: pnpm dlx @deessejs/cli@latest`,
  )
