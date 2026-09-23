import { readFileSync } from "node:fs"
import { join } from "node:path"

import { rewriteImports } from "./rewrite-imports"

type Args = {
  name: string
  title: string
  description: string
  sourcePath: string
  target: string
  dependencies?: string[]
  registryDependencies?: string[]
}

/**
 * Reads a source file from `apps/web/src/`, rewrites the
 * `@workspace/ui/*` imports to shadcn-standard paths, and
 * returns a registry-item JSON object.
 *
 * Single-file `registry:ui` items only for V1. Multi-file
 * `registry:block` items will get a sibling helper in V2.
 */
export function registryItem(args: Args) {
  const absolute = join(process.cwd(), "..", "..", args.sourcePath)
  const content = readFileSync(absolute, "utf8")
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: args.name,
    type: "registry:ui" as const,
    title: args.title,
    description: args.description,
    dependencies: args.dependencies ?? [],
    registryDependencies: args.registryDependencies ?? [],
    files: [
      {
        path: `components/marketing/${args.name}.tsx`,
        content: rewriteImports(content),
        type: "registry:ui" as const,
        target: args.target,
      },
    ],
  }
}