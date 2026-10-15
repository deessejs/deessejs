import { CliError } from "./index.js"

export const unsafeArchive = (reasons: string[]): CliError =>
  new CliError(
    "unsafe_archive",
    `tarball rejected: ${reasons.length} unsafe ${reasons.length === 1 ? "entry" : "entries"}`,
    `first reason: ${reasons[0] ?? ""}`,
  )