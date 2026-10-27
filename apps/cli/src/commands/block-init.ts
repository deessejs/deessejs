import { lstat, open, readFile, unlink } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { Command } from "commander"
import {
  BLOCK_DESCRIPTOR_SCHEMA_URL,
  type BlockDescriptorV1,
} from "@workspace/registry/v1"

import { blockInvalid, internal } from "../errors/index.js"
import { printBlockCheck, printError, printJson } from "../output/index.js"
import { checkBlockDescriptorCandidate } from "../utils/resolve-block-info.js"

type InitOptions = {
  input?: string
  json?: boolean
}

function suggestedName(directory: string): string {
  const value = basename(resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return /^[a-z]/.test(value) ? value : `block-${value || "new"}`
}

async function promptValue(
  ask: (question: string) => Promise<string>,
  label: string,
  defaultValue?: string
): Promise<string> {
  while (true) {
    const suffix = defaultValue ? ` [${defaultValue}]` : ""
    const answer = (await ask(`${label}${suffix}: `)).trim()
    const value = answer || defaultValue || ""
    if (value) return value
    process.stderr.write("This value is required.\n")
  }
}

async function promptCount(
  ask: (question: string) => Promise<string>,
  label: string,
  minimum: number
): Promise<number> {
  while (true) {
    const value = Number((await ask(`${label} (${minimum} or more): `)).trim())
    if (Number.isInteger(value) && value >= minimum && value <= 100) return value
    process.stderr.write(`Enter a whole number from ${minimum} to 100.\n`)
  }
}

async function promptYesNo(
  ask: (question: string) => Promise<string>,
  label: string,
  defaultValue = false
): Promise<boolean> {
  const answer = (await ask(`${label} [${defaultValue ? "Y/n" : "y/N"}]: `))
    .trim()
    .toLowerCase()
  if (!answer) return defaultValue
  return answer === "y" || answer === "yes"
}

async function createInteractiveCandidate(directory: string): Promise<BlockDescriptorV1> {
  const rl = createInterface({ input: stdin, output: process.stderr })
  const ask = (question: string) => rl.question(question)
  try {
    process.stderr.write("Create a V1 DeesseJS block descriptor.\n\n")
    const name = await promptValue(ask, "Block name", suggestedName(directory))
    const version = await promptValue(ask, "Version", "0.1.0")
    const description = await promptValue(ask, "Description")

    const packageCount = await promptCount(ask, "Number of output packages", 1)
    const packages: BlockDescriptorV1["install"]["packages"] = []
    for (let index = 0; index < packageCount; index += 1) {
      process.stderr.write(`\nPackage ${index + 1}\n`)
      const id = await promptValue(
        ask,
        "  ID",
        index === 0 ? "main" : `package-${index + 1}`
      )
      packages.push({
        id,
        path: await promptValue(ask, "  Destination path", `packages/${id}`),
      })
    }

    const providesCount = await promptCount(ask, "\nNumber of capabilities provided", 1)
    const provides: BlockDescriptorV1["provides"] = []
    for (let index = 0; index < providesCount; index += 1) {
      process.stderr.write(`\nCapability ${index + 1}\n`)
      provides.push({
        capability: await promptValue(ask, "  Capability"),
        provider: await promptValue(ask, "  Provider"),
        package: await promptValue(ask, "  Output package ID", packages[0]?.id),
      })
    }

    const fileCount = await promptCount(ask, "\nNumber of source files to map", 1)
    const files: BlockDescriptorV1["install"]["files"] = []
    for (let index = 0; index < fileCount; index += 1) {
      process.stderr.write(`\nFile mapping ${index + 1}\n`)
      files.push({
        from: await promptValue(
          ask,
          "  Source file path",
          index === 0
            ? `files/${name}/package.json`
            : `files/${name}/file-${index + 1}.txt`
        ),
        to: {
          package: await promptValue(ask, "  Output package ID", packages[0]?.id),
          path: await promptValue(
            ask,
            "  Package-relative destination path",
            index === 0 ? "package.json" : `src/file-${index + 1}.txt`
          ),
        },
      })
    }

    const environment: NonNullable<BlockDescriptorV1["install"]["environment"]> = []
    if (await promptYesNo(ask, "\nAdd environment variables?")) {
      const count = await promptCount(ask, "Number of variables", 1)
      for (let index = 0; index < count; index += 1) {
        process.stderr.write(`\nVariable ${index + 1}\n`)
        const variableName = await promptValue(ask, "  Name")
        const required = await promptYesNo(ask, "  Required?", true)
        const secret = await promptYesNo(ask, "  Secret?")
        const description = (await ask("  Description (optional): ")).trim()
        environment.push({
          name: variableName,
          required,
          secret,
          ...(description ? { description } : {}),
        })
      }
    }

    const manualSteps: string[] = []
    if (await promptYesNo(ask, "\nAdd manual steps?")) {
      const count = await promptCount(ask, "Number of steps", 1)
      for (let index = 0; index < count; index += 1) {
        manualSteps.push(await promptValue(ask, `Step ${index + 1}`))
      }
    }

    return {
      $schema: BLOCK_DESCRIPTOR_SCHEMA_URL,
      formatVersion: 1,
      name,
      version,
      description,
      provides,
      install: {
        packages,
        files,
        ...(environment.length ? { environment } : {}),
        ...(manualSteps.length ? { manualSteps } : {}),
      },
    }
  } finally {
    rl.close()
  }
}

async function readCandidate(inputPath: string): Promise<unknown> {
  const absolutePath = resolve(inputPath)
  let text: string
  try {
    text = await readFile(absolutePath, "utf8")
  } catch (error) {
    throw blockInvalid(inputPath, error instanceof Error ? error.message : String(error))
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw blockInvalid(inputPath, "input file is not valid JSON")
  }
}

async function assertDestinationAvailable(directory: string): Promise<string> {
  const root = resolve(directory)
  let directoryStat
  try {
    directoryStat = await lstat(root)
  } catch {
    throw blockInvalid(directory, "block directory was not found")
  }
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
    throw blockInvalid(directory, "block destination must be a directory, not a symlink")
  }
  const descriptorPath = resolve(root, "deesse-block.json")
  try {
    await lstat(descriptorPath)
    throw blockInvalid(descriptorPath, "descriptor already exists and will not be overwritten")
  } catch (error) {
    if (error instanceof Error && error.name === "CliError") throw error
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw blockInvalid(descriptorPath, "descriptor destination could not be inspected")
    }
  }
  return descriptorPath
}

async function writeDescriptorExclusive(
  path: string,
  descriptor: BlockDescriptorV1
): Promise<void> {
  let handle
  try {
    handle = await open(path, "wx", 0o644)
    await handle.writeFile(JSON.stringify(descriptor, null, 2) + "\n", "utf8")
  } catch (error) {
    if (handle) {
      await handle.close().catch(() => undefined)
      await unlink(path).catch(() => undefined)
    }
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw blockInvalid(path, "descriptor already exists and will not be overwritten")
    }
    throw blockInvalid(path, error instanceof Error ? error.message : String(error))
  } finally {
    if (handle) await handle.close().catch(() => undefined)
  }
}

export const blockInitCommand = new Command("init")
  .description("Create and validate a V1 block descriptor")
  .argument("[directory]", "existing local block directory", ".")
  .option("--input <file>", "read a candidate V1 descriptor from a JSON file")
  .option("--json", "JSON output for scripting; requires --input")
  .action(async (directory: string, options: InitOptions) => {
    try {
      if (options.json && !options.input) {
        throw blockInvalid(
          "block init",
          "--json requires --input so the command can run without prompts"
        )
      }
      if (!options.input && (!stdin.isTTY || !stdout.isTTY)) {
        throw blockInvalid(
          "block init",
          "interactive mode requires a terminal; pass --input <file> for non-interactive use"
        )
      }

      const descriptorPath = await assertDestinationAvailable(directory)
      const candidate = options.input
        ? await readCandidate(options.input)
        : await createInteractiveCandidate(directory)
      const result = await checkBlockDescriptorCandidate(directory, candidate)
      if (result.diagnostics.length > 0 || !result.descriptor) {
        if (options.json) {
          printJson({ ok: false, command: "block init", ...result })
        } else {
          process.stderr.write("Block descriptor validation failed.\n")
          printBlockCheck(result)
        }
        process.exitCode = 1
        return
      }

      await writeDescriptorExclusive(descriptorPath, result.descriptor)
      if (options.json) {
        printJson({
          ok: true,
          command: "block init",
          path: descriptorPath,
          descriptor: result.descriptor,
          filesChecked: result.filesChecked,
          packages: result.packages,
        })
      } else {
        process.stdout.write(`Created ${descriptorPath}\n`)
        printBlockCheck(result)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "CliError") {
        if (options.json) {
          printJson({
            ok: false,
            command: "block init",
            code: (error as { code?: string }).code,
            message: error.message,
            hint: (error as { hint?: string }).hint,
          })
        } else {
          printError(error as Parameters<typeof printError>[0])
        }
        process.exitCode = 2
        return
      }
      throw internal(error instanceof Error ? error.message : String(error))
    }
  })
