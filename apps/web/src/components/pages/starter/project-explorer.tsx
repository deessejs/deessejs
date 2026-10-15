"use client"

import { useState, type CSSProperties } from "react"
import { File as PierreFile } from "@pierre/diffs/react"
import {
  FileTree,
  useFileTree,
  useFileTreeSelection,
} from "@pierre/trees/react"
import { FileCode2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

type ProjectFile = {
  label: string
  technology: string
  logo: string
  description: string
  contents: string
}

const projectFiles = {
  "packages/auth/src/auth.ts": {
    label: "Authentication",
    technology: "Better Auth",
    logo: "betterauth",
    description:
      "Email verification and session handling are configured in the shared auth package.",
    contents: `import { betterAuth } from "better-auth"\nimport { drizzleAdapter } from "@better-auth/drizzle-adapter"\nimport { db } from "@workspace/database"\nimport * as schema from "@workspace/database"\n\nexport const auth = betterAuth({\n  database: drizzleAdapter(db, {\n    provider: "pg",\n    schema,\n  }),\n  emailAndPassword: {\n    enabled: true,\n    requireEmailVerification: true,\n  },\n})`,
  },
  "packages/database/src/schema/auth.ts": {
    label: "Database schema",
    technology: "Drizzle ORM",
    logo: "drizzle",
    description:
      "Drizzle tables define the user and session data used by Better Auth.",
    contents: `import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"\n\nexport const user = pgTable("user", {\n  id: text("id").primaryKey(),\n  name: text("name").notNull(),\n  email: text("email").notNull().unique(),\n  emailVerified: boolean("email_verified")\n    .default(false)\n    .notNull(),\n  createdAt: timestamp("created_at")\n    .defaultNow()\n    .notNull(),\n})`,
  },
  "packages/api/src/router/user.ts": {
    label: "Protected API",
    technology: "Hono + oRPC",
    logo: "hono",
    description:
      "A protected profile procedure receives the authenticated user from request context.",
    contents: `import { base } from "./context.js"\nimport { authMiddleware } from "./middlewares/auth.js"\n\nconst protectedBase = base.use(authMiddleware)\n\nexport const getProfile = protectedBase.handler(\n  async ({ context }) => {\n    return context.user\n  },\n)`,
  },
} satisfies Record<string, ProjectFile>

const projectPaths = [
  "apps/app/package.json",
  "apps/docs/package.json",
  "apps/web/package.json",
  "packages/api/src/router/user.ts",
  "packages/auth/src/auth.ts",
  "packages/cookies/package.json",
  "packages/database/src/schema/auth.ts",
  "packages/email/src/index.ts",
  "packages/env/package.json",
  "packages/ui/package.json",
  "packages/utils/package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
] as const

const tabs = Object.entries(projectFiles).map(([path, file]) => ({
  path,
  ...file,
}))

const defaultPath = tabs[0]?.path ?? "packages/auth/src/auth.ts"

export function ProjectExplorer() {
  const [activePath, setActivePath] = useState(defaultPath)
  const { model } = useFileTree({
    paths: projectPaths,
    initialExpansion: "open",
    initialSelectedPaths: [defaultPath],
    icons: "standard",
    density: "compact",
  })
  const selectedPaths = useFileTreeSelection(model)
  const selectedFilePath = selectedPaths.find((path) => path in projectFiles)
  const currentPath = selectedFilePath ?? activePath
  const currentFile = projectFiles[currentPath as keyof typeof projectFiles]

  function selectFile(path: string) {
    setActivePath(path)
    model.getItem(path)?.select()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-col border-b border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <FileCode2 className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium">Inside the starter</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:mt-0">
          Real files from the public repository
        </p>
      </div>
      <div className="grid min-w-0 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-border p-3 lg:border-r lg:border-b-0">
          <p className="px-2 pb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Project files
          </p>
          <FileTree
            model={model}
            aria-label="SaaS starter project files"
            style={
              {
                height: "360px",
                "--trees-border-color-override": "var(--border)",
                "--trees-fg-override": "var(--foreground)",
                "--trees-selected-bg-override": "var(--accent)",
              } as CSSProperties
            }
          />
        </aside>
        <div className="min-w-0">
          <div
            role="tablist"
            aria-label="Technology examples"
            className="flex overflow-x-auto border-b border-border px-3"
          >
            {tabs.map((tab) => (
              <Button
                key={tab.path}
                type="button"
                variant="ghost"
                role="tab"
                aria-selected={currentPath === tab.path}
                aria-controls="starter-source-panel"
                onClick={() => selectFile(tab.path)}
                className="flex min-h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-xs text-muted-foreground transition-colors aria-selected:border-primary aria-selected:text-foreground"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/${tab.logo}.svg`}
                  alt=""
                  width="16"
                  height="16"
                  className="size-4"
                  aria-hidden
                />
                <span>{tab.technology}</span>
              </Button>
            ))}
          </div>
          <div id="starter-source-panel" role="tabpanel" className="min-w-0">
            {currentFile ? (
              <div className="min-w-0">
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {currentPath}
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {currentFile.description}
                  </p>
                </div>
                <PierreFile
                  file={{ name: currentPath, contents: currentFile.contents }}
                  options={{
                    theme: "github-light",
                    themeType: "light",
                    overflow: "scroll",
                  }}
                  className="max-h-[360px] min-h-[280px] overflow-auto text-xs sm:text-sm"
                />
              </div>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                Choose one of the technology tabs to see a source excerpt.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
