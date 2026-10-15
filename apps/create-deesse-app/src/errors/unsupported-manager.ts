import { CliError } from "./index.js"

export const unsupportedManager = (invoker: string): CliError =>
  new CliError(
    "unsupported_manager",
    `${invoker} is not a supported invocation manager for this increment`,
    `use "pnpm dlx create-deesse-app@latest <name>" instead`,
  )