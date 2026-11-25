import { Command } from "commander"
import { CliError } from "../errors/index.js"
import { printError, printJson } from "../output/index.js"
import { publishManagedRelease } from "../utils/publish-release.js"

function publishCommand(kind: "template" | "block") {
  return new Command("publish")
    .description(`Publish this local ${kind} as an immutable managed release`)
    .requiredOption("--slug <slug>", `${kind} registry slug`)
    .requiredOption(
      "--destination <destination>",
      "deessejs or an organization slug"
    )
    .option("--json", "JSON output for scripting")
    .option("--verbose", "show human-readable output")
    .action(
      async (options: {
        slug: string
        destination: string
        json?: boolean
        verbose?: boolean
      }) => {
        const json = !options.verbose || !!options.json
        try {
          const release = await publishManagedRelease({
            kind,
            slug: options.slug,
            destination: options.destination,
          })
          const output = { ok: true, kind, ...release }
          if (json) printJson(output)
          else
            process.stdout.write(
              `${release.alreadyPublished ? "Already published" : "Published"} ${options.slug}@${release.version}\n`
            )
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (json) {
            printJson({
              ok: false,
              command: `${kind} publish`,
              code: "publish_failed",
              message,
            })
          } else if (error instanceof CliError) {
            printError(error)
          } else {
            process.stderr.write(`Error: ${message}\n`)
          }
          process.exitCode = 1
        }
      }
    )
}

export const templatePublishCommand = publishCommand("template")
export const blockPublishCommand = publishCommand("block")
