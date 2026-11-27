const TEMPLATE_COMMANDS = new Set(["list", "info", "init", "publish", "releases"])

/** Maps the template namespace and its legacy alias onto existing handlers. */
export function normalizeTemplateCommandArgs(args: string[]): string[] {
  const commandIndex = 2
  if (args[commandIndex] !== "template" && args[commandIndex] !== "templates") {
    return args
  }

  const templateCommand = args[commandIndex + 1]
  if (!templateCommand) return [...args.slice(0, commandIndex), "--help"]
  if (templateCommand === "--help" || templateCommand === "-h") {
    return [...args.slice(0, commandIndex), ...args.slice(commandIndex + 1)]
  }
  if (!TEMPLATE_COMMANDS.has(templateCommand)) return args

  return [...args.slice(0, commandIndex), ...args.slice(commandIndex + 2)]
}
