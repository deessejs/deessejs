import { Command } from "commander"
import { publishManagedRelease } from "../utils/publish-release.js"

function publishCommand(kind: "template" | "block") {
  return new Command("publish")
    .description(`Publish this local ${kind} as an immutable managed release`)
    .requiredOption("--slug <slug>", `${kind} registry slug`)
    .requiredOption("--destination <destination>", "deessejs or an organization slug")
    .option("--json", "JSON output for scripting")
    .action(async (options: { slug: string; destination: string; json?: boolean }) => {
      try {
        const release = await publishManagedRelease({ kind, slug: options.slug, destination: options.destination })
        const output = { ok: true, kind, ...release }
        if (options.json) process.stdout.write(`${JSON.stringify(output)}\n`)
        else process.stdout.write(`${release.alreadyPublished ? "Already published" : "Published"} ${options.slug}@${release.version}\n`)
      } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
      }
    })
}

export const templatePublishCommand = publishCommand("template")
export const blockPublishCommand = publishCommand("block")
