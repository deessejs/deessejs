import { rewriteImports } from "./rewrite-imports"

type Args = {
  name: string
  title: string
  description: string
  /**
   * The item's source content, captured at build time. Inlining
   * keeps the registry self-contained — no `process.cwd()` walk,
   * no runtime `readFileSync` against `packages/ui/src/...` —
   * which means the deployable server bundle survives both
   * Vercel's `/var/task` cwd and any future workspace-relative
   * packaging change.
   */
  source: string
  target: string
  dependencies?: string[]
  registryDependencies?: string[]
}

/**
 * Builds a registry-item JSON object for a single-file
 * `registry:ui` item. Source content is inlined in
 * `apps/web/src/registry/items/<name>.ts` and imports are
 * rewritten to shadcn-standard paths (`@/components/ui/<X>`,
 * `@/lib/utils`) on the way out, so consumers can paste it
 * into a stock shadcn project without any `@workspace/ui`
 * dependency.
 *
 * Multi-file `registry:block` items will get a sibling helper
 * in V2.
 */
export function registryItem(args: Args) {
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
        content: rewriteImports(args.source),
        type: "registry:ui" as const,
        target: args.target,
      },
    ],
  }
}
