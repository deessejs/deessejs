import { CliError } from "./index.js"

export const notFound = (slug: string, available: string[]): CliError =>
  new CliError(
    "not_found",
    `template "${slug}" not found`,
    `available templates: ${available.join(", ")}`,
  )
