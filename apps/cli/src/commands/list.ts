import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { fetchTemplates } from "../api/index.js"
import { CliError, internal } from "../errors/index.js"
import { printError, printJson, printTemplatesTable } from "../output/index.js"

export const listCommand = new Command("list")
  .description("List available templates")
  .option("--category <name>", "filter to a single category")
  .option("--json", "JSON output for scripting")
  .action((options: ListCommandOptions) => runListCommand(options))

type ListCommandOptions = { category?: string; json?: boolean }
type ListSpinner = ReturnType<typeof ora> | null

async function runListCommand(options: ListCommandOptions): Promise<void> {
  const spinner = options.json ? null : ora("Fetching templates...").start()
  try {
    const all = await fetchTemplates()
    const filtered = options.category
      ? all.filter((template) => template.category === options.category)
      : all
    spinner?.stop()
    renderTemplates(filtered, options, spinner)
  } catch (error) {
    reportListError(error, options.json ?? false, spinner)
  }
}

function renderTemplates(
  templates: Awaited<ReturnType<typeof fetchTemplates>>,
  options: ListCommandOptions,
  _spinner: ListSpinner
): void {
  if (options.json) {
    printJson({ templates })
    return
  }
  if (options.category) console.log(pc.dim(`Category: ${options.category}`))
  printTemplatesTable(templates)
  console.log()
  const hint = options.category
    ? ""
    : " Use --category <name> to filter, --json for scripting."
  console.log(
    pc.dim(
      `${templates.length} template${templates.length === 1 ? "" : "s"}.${hint}`
    )
  )
}

function reportListError(
  error: unknown,
  json: boolean,
  spinner: ListSpinner
): never {
  spinner?.fail("Failed to fetch templates")
  if (!(error instanceof CliError)) {
    throw internal(error instanceof Error ? error.message : String(error))
  }
  if (json) {
    printJson({
      ok: false,
      code: error.code,
      message: error.message,
      hint: error.hint,
    })
  } else {
    printError(error)
  }
  process.exit(1)
}
