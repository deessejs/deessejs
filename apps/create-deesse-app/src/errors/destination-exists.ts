import { CliError } from "./index.js"

export const destinationExists = (dir: string): CliError =>
  new CliError(
    "destination_exists",
    `target directory "${dir}" already exists`,
    "remove the directory or pick a different --dir",
  )