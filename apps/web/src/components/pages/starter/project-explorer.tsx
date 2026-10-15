"use client"

import { useState } from "react"
import { ChevronRight, FileCode2, Folder } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const files = {
  "apps/app": {
    title: "The product surface",
    description: "A Next.js application with the authenticated routes and account screens already in place.",
    path: "apps/app/src/app/(app)/layout.tsx",
    code: `export default function AppLayout({ children }) {\n  return (\n    <AppShell>\n      <Sidebar />\n      <main>{children}</main>\n    </AppShell>\n  )\n}`,
  },
  "apps/web": {
    title: "The public website",
    description: "A separate Next.js app for your product site, sharing UI and configuration packages.",
    path: "apps/web/src/app/page.tsx",
    code: `export default function HomePage() {\n  return <MarketingHome />\n}`,
  },
  "packages/auth": {
    title: "Authentication",
    description: "Email and password authentication, session handling, and verification flows powered by Better Auth.",
    path: "packages/auth/src/index.ts",
    code: `export const auth = betterAuth({\n  database: drizzleAdapter(db),\n  emailAndPassword: {\n    enabled: true,\n    requireEmailVerification: true,\n  },\n})`,
  },
  "packages/database": {
    title: "Database layer",
    description: "PostgreSQL schema and Drizzle configuration shared across the applications.",
    path: "packages/database/src/schema/index.ts",
    code: `export const users = pgTable("user", {\n  id: text("id").primaryKey(),\n  name: text("name").notNull(),\n  email: text("email").notNull(),\n})`,
  },
  "packages/api": {
    title: "Typed API",
    description: "An API package with a protected profile endpoint and a clear place to add your product logic.",
    path: "packages/api/src/router/user.ts",
    code: `export const getProfile = protectedBase.handler(\n  async ({ context }) => context.user,\n)`,
  },
} as const

type ExplorerPath = keyof typeof files

const tree: ExplorerPath[] = [
  "apps/web",
  "apps/app",
  "packages/auth",
  "packages/database",
  "packages/api",
]

export function ProjectExplorer() {
  const [selected, setSelected] = useState<ExplorerPath>("apps/app")
  const file = files[selected]

  return (
    <div className="grid min-w-0 border border-border bg-background lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Starter project areas" className="border-b border-border p-3 lg:border-b-0 lg:border-r">
        <p className="px-2 pb-3 font-mono text-xs text-muted-foreground">PROJECT EXPLORER</p>
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {tree.map((path) => (
            <li key={path} className="shrink-0">
              <Button
                type="button"
                onClick={() => setSelected(path)}
                aria-pressed={selected === path}
                variant="ghost"
                className="h-auto w-full justify-start gap-2 rounded-sm px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
              >
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                <Folder className="size-4 shrink-0" aria-hidden />
                <span className="font-mono">{path}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div aria-live="polite" className="min-w-0 p-5 sm:p-7">
        <div className="mb-5 flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
          <FileCode2 className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{file.path}</span>
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{file.title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{file.description}</p>
        <pre className="mt-6 overflow-x-auto border border-border bg-muted/50 p-4 text-xs leading-6 sm:p-5 sm:text-sm"><code>{file.code}</code></pre>
        <p className="mt-3 text-xs text-muted-foreground">Representative excerpt from the starter repository.</p>
      </div>
    </div>
  )
}

export function ProjectPreview() {
  return (
    <div aria-label="Monorepo structure preview" className="overflow-hidden border border-border bg-background text-left shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-mono text-xs text-muted-foreground">
        <span aria-hidden className="size-2 rounded-full bg-muted-foreground/40" />
        <span aria-hidden className="size-2 rounded-full bg-muted-foreground/40" />
        <span aria-hidden className="size-2 rounded-full bg-muted-foreground/40" />
        <span className="ml-2">saas-template</span>
      </div>
      <div className="space-y-2 p-5 font-mono text-xs sm:p-6 sm:text-sm">
        <p className="text-muted-foreground">├── apps/</p>
        <p className="pl-5">├── app <span className="font-sans text-muted-foreground">product application</span></p>
        <p className="pl-5">├── web <span className="font-sans text-muted-foreground">marketing website</span></p>
        <p className="text-muted-foreground">├── packages/</p>
        <p className="pl-5">├── auth <span className="font-sans text-muted-foreground">Better Auth</span></p>
        <p className="pl-5">├── database <span className="font-sans text-muted-foreground">Drizzle + PostgreSQL</span></p>
        <p className="pl-5">└── api <span className="font-sans text-muted-foreground">Hono + oRPC</span></p>
        <p className="text-muted-foreground">└── turbo.json</p>
      </div>
    </div>
  )
}
