"use client"

import { useMemo, type CSSProperties } from "react"
import { FileCode2, ExternalLink } from "lucide-react"
import { File as PierreFile } from "@pierre/diffs/react"
import {
  FileTree,
  useFileTree,
  useFileTreeSelection,
} from "@pierre/trees/react"

import { CopyCommand } from "@/components/marketing/copy-command"

const REPO_URL = "https://github.com/deessejs/saas-template"

/**
 * Real paths from the public saas-template repository. Kept honest:
 * every path here resolves on GitHub. The 3 paths that also have
 * `description` + `contents` below are the ones rendered in the code
 * viewer; the rest exist in the tree but show the path + language only
 * when selected (no fake code).
 */
const projectPaths = [
  "apps/app/package.json",
  "apps/app/src/app/(app)/layout.tsx",
  "apps/web/package.json",
  "apps/web/src/app/(marketing)/page.tsx",
  "packages/api/package.json",
  "packages/api/src/router/user.ts",
  "packages/auth/package.json",
  "packages/auth/src/auth.ts",
  "packages/cookies/package.json",
  "packages/database/package.json",
  "packages/database/src/schema/auth.ts",
  "packages/email/package.json",
  "packages/email/src/index.ts",
  "packages/env/package.json",
  "packages/ui/package.json",
  "packages/utils/package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
] as const

type ProjectFile = {
  description: string
  contents: string
}

const projectFiles: Record<string, ProjectFile> = {
  "packages/auth/src/auth.ts": {
    description:
      "Email and password authentication, with email verification, are configured in the shared auth package.",
    contents: `import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
})`,
  },
  "packages/database/src/schema/auth.ts": {
    description:
      "Drizzle tables define the user and session data that Better Auth reads from.",
    contents: `import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
})`,
  },
  "packages/api/src/router/user.ts": {
    description:
      "A protected procedure receives the authenticated user from request context.",
    contents: `import { base } from "./context.js"
import { authMiddleware } from "./middlewares/auth.js"

const protectedBase = base.use(authMiddleware)

export const getProfile = protectedBase.handler(
  async ({ context }) => {
    return context.user
  },
)`,
  },
}

const defaultPath = "packages/auth/src/auth.ts"

const HEIGHT = 360

const themeVars: CSSProperties = {
  height: HEIGHT,
  // Tree styling — match the neutral DS palette.
  "--trees-bg-override": "var(--background)",
  "--trees-fg-override": "var(--foreground)",
  "--trees-fg-muted-override": "var(--muted-foreground)",
  "--trees-bg-muted-override": "var(--muted)",
  "--trees-border-color-override": "var(--border)",
  "--trees-selected-fg-override": "var(--accent-foreground)",
  "--trees-selected-bg-override": "var(--accent)",
  "--trees-selected-border-color-override": "var(--border)",
  "--trees-search-fg-override": "var(--foreground)",
  "--trees-search-bg-override": "var(--background)",
  "--trees-focus-ring-color-override": "var(--ring)",
}

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "ts") return "typescript"
  if (ext === "tsx") return "tsx"
  if (ext === "json") return "json"
  if (ext === "md") return "markdown"
  if (ext === "yaml" || ext === "yml") return "yaml"
  if (ext === "css") return "css"
  if (ext === "html") return "html"
  if (ext === "sh") return "bash"
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "javascript"
  return "text"
}

export function ProjectExplorer() {
  const { model } = useFileTree({
    paths: projectPaths,
    initialExpansion: "open",
    initialSelectedPaths: [defaultPath],
    icons: "standard",
    density: "compact",
    search: true,
    flattenEmptyDirectories: true,
  })
  const selectedPaths = useFileTreeSelection(model)
  const currentPath = useMemo(
    () => selectedPaths.find((path) => path in projectFiles) ?? defaultPath,
    [selectedPaths],
  )
  const currentFile = projectFiles[currentPath]
  const lang = langFromPath(currentPath)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <FileCode2 className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium">Inside the starter</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Real files from the public repository
        </p>
      </header>
      <div className="grid min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-border p-3 lg:border-r lg:border-b-0">
          <p className="px-2 pb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Project files
          </p>
          <FileTree
            model={model}
            aria-label="SaaS starter project files"
            style={themeVars}
          />
        </aside>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2 sm:px-5">
            <p className="truncate font-mono text-xs text-muted-foreground">
              {currentPath}
            </p>
            <a
              href={`${REPO_URL}/blob/main/${currentPath}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View on GitHub
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
          <div className="min-h-0" style={{ height: HEIGHT }}>
            {currentFile ? (
              <>
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <p className="text-sm text-foreground">
                    {currentFile.description}
                  </p>
                </div>
                <PierreFile
                  file={{ name: currentPath, contents: currentFile.contents, lang }}
                  options={{
                    theme: "github-light",
                    themeType: "system",
                    overflow: "scroll",
                  }}
                  style={{ height: HEIGHT - 60 }}
                />
              </>
            ) : (
              <PierreFile
                file={{ name: currentPath, contents: "", lang }}
                options={{
                  theme: "github-light",
                  themeType: "system",
                  overflow: "scroll",
                }}
                style={{ height: HEIGHT }}
              />
            )}
          </div>
        </div>
      </div>
      <footer className="border-t border-border px-4 py-3 sm:px-5">
        <p className="text-xs text-muted-foreground">
          Scaffold a local project with the same shape:
        </p>
        <div className="mt-2">
          <CopyCommand command="npx create-deesse-app@latest my-saas-app" />
        </div>
      </footer>
    </div>
  )
}
