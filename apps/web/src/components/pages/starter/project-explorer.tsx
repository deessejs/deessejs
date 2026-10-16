"use client"

import * as React from "react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  ChevronRight,
  FileCode,
  FilePlus,
  FolderPlus,
  GitBranch,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react"
import { File as PierreFile } from "@pierre/diffs/react"
import {
  createFileTreeIconResolver,
  getBuiltInSpriteSheet,
} from "@pierre/trees"
import {
  FileTree,
  useFileTree,
  useFileTreeSearch,
  useFileTreeSelection,
} from "@pierre/trees/react"
import { cn } from "@workspace/ui/lib/utils"

import { CopyCommand } from "@/components/marketing/copy-command"

const REPO_URL = "https://github.com/deessejs/saas-template"
const DEFAULT_EXPLORER_WIDTH = 280
const DEFAULT_MIN_EXPLORER_WIDTH = 200
const DEFAULT_MAX_EXPLORER_WIDTH = 520
const HEIGHT = 460

type ProjectFile = {
  contents: string
}

const projectFiles: Record<string, ProjectFile> = {
  "packages/auth/src/auth.ts": {
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

const allPaths = [
  "apps/app/package.json",
  "apps/app/src/app/(app)/layout.tsx",
  "apps/web/package.json",
  "apps/web/src/app/(marketing)/page.tsx",
  "apps/web/src/components/headers/site-header.tsx",
  "apps/web/src/lib/marketing/home-data.ts",
  "apps/web/src/lib/app-config.ts",
  "apps/web/src/components/footers/starter-footer.tsx",
  "packages/api/package.json",
  "packages/api/src/index.ts",
  "packages/api/src/router/user.ts",
  "packages/auth/package.json",
  "packages/auth/src/auth.ts",
  "packages/auth/src/host-allowlist.ts",
  "packages/cookies/package.json",
  "packages/database/package.json",
  "packages/database/src/client.ts",
  "packages/database/src/schema/auth.ts",
  "packages/database/src/schema/index.ts",
  "packages/email/package.json",
  "packages/email/src/index.ts",
  "packages/env/package.json",
  "packages/ui/package.json",
  "packages/ui/src/components/button.tsx",
  "packages/utils/package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
  "package.json",
  "README.md",
] as const

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

function basename(path: string): string {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path
  const lastSlash = trimmed.lastIndexOf("/")
  return lastSlash < 0 ? trimmed : trimmed.slice(lastSlash + 1)
}

const builtInSpriteSheet = getBuiltInSpriteSheet()

type ThemeName = "light" | "dark"

const lightTreeStyle: CSSProperties = {
  "--trees-bg-override": "#ffffff",
  "--trees-fg-override": "#18181b",
  "--trees-fg-muted-override": "#71717a",
  "--trees-bg-muted-override": "#f4f4f5",
  "--trees-border-color-override": "#e4e4e7",
  "--trees-selected-fg-override": "#18181b",
  "--trees-selected-bg-override": "#f4f4f5",
  "--trees-selected-border-color-override": "#e4e4e7",
  "--trees-selected-focused-border-color-override": "#a1a1aa",
  "--trees-focus-ring-color-override": "#a1a1aa",
  "--trees-search-fg-override": "#18181b",
  "--trees-search-bg-override": "#ffffff",
}

const darkTreeStyle: CSSProperties = {
  "--trees-bg-override": "#070707",
  "--trees-fg-override": "#e4e4e7",
  "--trees-fg-muted-override": "#a1a1aa",
  "--trees-bg-muted-override": "#141415",
  "--trees-border-color-override": "#27272a",
  "--trees-selected-fg-override": "#e4e4e7",
  "--trees-selected-bg-override": "#141415",
  "--trees-selected-border-color-override": "#27272a",
  "--trees-selected-focused-border-color-override": "#3f3f46",
  "--trees-focus-ring-color-override": "#52525b",
  "--trees-search-fg-override": "#e4e4e7",
  "--trees-search-bg-override": "#0c0c0d",
}

const fileOptionsByTheme: Record<
  ThemeName,
  {
    theme: "pierre-light" | "pierre-dark"
    themeType: ThemeName
    overflow: "wrap" | "scroll"
    enableLineSelection: true
    disableFileHeader: true
  }
> = {
  dark: {
    theme: "pierre-dark",
    themeType: "dark",
    overflow: "wrap",
    enableLineSelection: true,
    disableFileHeader: true,
  },
  light: {
    theme: "pierre-light",
    themeType: "light",
    overflow: "wrap",
    enableLineSelection: true,
    disableFileHeader: true,
  },
}

function MacOSChrome() {
  return (
    <div
      className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-background px-4"
      role="presentation"
    >
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#ff5f57]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#febc2e]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#28c840]"
        />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground">
          saas-template
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <GitBranch className="size-3.5" aria-hidden />
        <span className="font-mono text-xs">main</span>
      </div>
    </div>
  )
}

function ProjectExplorer() {
  const [theme, setTheme] = useState<ThemeName>("dark")
  const [explorerWidth, setExplorerWidth] = useState(DEFAULT_EXPLORER_WIDTH)
  const [openTabs, setOpenTabs] = useState<string[]>(["packages/auth/src/auth.ts"])
  const [activePath, setActivePath] = useState<string>("packages/auth/src/auth.ts")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  const { model } = useFileTree({
    paths: allPaths,
    initialExpansion: "open",
    initialSelectedPaths: ["packages/auth/src/auth.ts"],
    initialExpandedPaths: ["packages", "apps"],
    icons: createFileTreeIconResolver({
      spriteSheet: builtInSpriteSheet,
      size: 14,
    }),
    density: "compact",
    search: true,
  })

  const selectedPaths = useFileTreeSelection(model)
  const { value: searchValue, setValue: setSearchValue } =
    useFileTreeSearch(model)

  // When the user clicks a tree node, open it as a tab and activate it.
  useEffect(() => {
    if (selectedPaths.length === 0) return
    const first = selectedPaths[0]
    if (first == null) return
    setOpenTabs((tabs) => (tabs.includes(first) ? tabs : [...tabs, first]))
    setActivePath(first)
  }, [selectedPaths])

  const activeFile = projectFiles[activePath]
  const activeFileName = basename(activePath)
  const activeLang = langFromPath(activePath)
  const isSearchOpen = searchValue.length > 0

  const closeTab = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== path)
      if (path === activePath && next.length > 0) {
        const fallback = next[next.length - 1]
        if (fallback != null) setActivePath(fallback)
      } else if (next.length === 0) {
        setActivePath("")
      }
      return next
    })
  }, [activePath])

  const activateTab = useCallback((path: string) => {
    setActivePath(path)
  }, [])

  // Resize handle between the explorer and the editor
  const onResizeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    draggingRef.current = true
    const startX = e.clientX
    const startWidth = explorerWidth
    const containerWidth = containerRef.current?.clientWidth ?? startWidth
    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return
      const delta = ev.clientX - startX
      const next = Math.min(
        DEFAULT_MAX_EXPLORER_WIDTH,
        Math.max(
          DEFAULT_MIN_EXPLORER_WIDTH,
          Math.min(startWidth + delta, containerWidth - 200),
        ),
      )
      setExplorerWidth(next)
    }
    const onUp = () => {
      draggingRef.current = false
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [explorerWidth])

  const containerClass = cn(
    "overflow-hidden rounded-xl border border-border shadow-2xl",
    theme === "dark"
      ? "bg-[#070707] text-zinc-200"
      : "bg-white text-zinc-900",
  )

  const tabbarClass = cn(
    "flex shrink-0 items-center border-b border-border",
    theme === "dark" ? "bg-[#070707]" : "bg-white",
  )

  return (
    <div className={containerClass} ref={containerRef}>
      <MacOSChrome />
      <div className={tabbarClass} role="tablist" aria-label="Open files">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {openTabs.map((path) => {
            const isActive = path === activePath
            return (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => activateTab(path)}
                className={cn(
                  "group/tabbar relative flex h-9 shrink-0 items-center gap-2 border-r border-border px-3 text-xs transition-colors",
                  isActive
                    ? theme === "dark"
                      ? "bg-neutral-900 text-zinc-100"
                      : "bg-zinc-100 text-zinc-900"
                    : theme === "dark"
                      ? "bg-transparent text-zinc-400 hover:bg-neutral-900/50 hover:text-zinc-200"
                      : "bg-transparent text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900",
                )}
              >
                <FileCode
                  className={cn(
                    "size-3.5 shrink-0",
                    isActive ? "text-primary" : "",
                  )}
                  aria-hidden
                />
                <span className="truncate font-mono text-xs">
                  {basename(path)}
                </span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Close ${basename(path)}`}
                  onClick={(e) => closeTab(path, e)}
                  className={cn(
                    "ml-1 inline-flex size-4 shrink-0 items-center justify-center rounded-sm",
                    theme === "dark"
                      ? "text-neutral-500 hover:bg-neutral-800 hover:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900",
                  )}
                >
                  <X className="size-3" aria-hidden />
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center border-l border-border",
            theme === "dark"
              ? "text-neutral-400 hover:text-neutral-100"
              : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          {theme === "dark" ? (
            <Sun className="size-3.5" aria-hidden />
          ) : (
            <Moon className="size-3.5" aria-hidden />
          )}
        </button>
      </div>

      <div
        className="flex"
        style={{ height: HEIGHT }}
      >
        <aside
          className="flex shrink-0 flex-col overflow-hidden border-r border-border"
          style={{
            width: explorerWidth,
            backgroundColor: theme === "dark" ? "#0a0a0b" : "#fafafa",
          }}
        >
          <header
            className="flex h-10 shrink-0 items-center justify-between gap-1 border-b border-border px-3"
          >
            <span
              className={cn(
                "font-mono text-[11px] font-semibold tracking-wide uppercase",
                theme === "dark" ? "text-neutral-300" : "text-zinc-700",
              )}
            >
              Explorer
            </span>
            <div className="flex items-center gap-0.5">
              <IconButton
                theme={theme}
                aria-label="New file"
                onClick={() => undefined}
              >
                <FilePlus className="size-3.5" aria-hidden />
              </IconButton>
              <IconButton
                theme={theme}
                aria-label="New folder"
                onClick={() => undefined}
              >
                <FolderPlus className="size-3.5" aria-hidden />
              </IconButton>
              <IconButton
                theme={theme}
                aria-label="Toggle search"
                onClick={() => setSearchValue(isSearchOpen ? "" : "auth")}
                aria-pressed={isSearchOpen}
              >
                <Search
                  className={cn(
                    "size-3.5",
                    isSearchOpen
                      ? theme === "dark"
                        ? "text-neutral-100"
                        : "text-zinc-900"
                      : "",
                  )}
                  aria-hidden
                />
              </IconButton>
            </div>
          </header>
          <div className="min-h-0 flex-1">
            <FileTree
              model={model}
              aria-label="SaaS starter project files"
              style={{
                ...(theme === "dark" ? darkTreeStyle : lightTreeStyle),
                height: "100%",
              }}
            />
          </div>
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={onResizeStart}
          className={cn(
            "w-px shrink-0 cursor-col-resize",
            theme === "dark" ? "bg-border" : "bg-border",
          )}
        />

        <div
          className="min-w-0 flex-1"
          style={{
            backgroundColor: theme === "dark" ? "#070707" : "#ffffff",
          }}
        >
          {activeFile && activePath ? (
            <PierreFile
              file={{
                name: activeFileName,
                contents: activeFile.contents,
                lang: activeLang,
              }}
              options={fileOptionsByTheme[theme]}
              className="h-full"
            />
          ) : (
            <div
              className={cn(
                "flex h-full items-center justify-center text-sm",
                theme === "dark" ? "text-zinc-500" : "text-zinc-500",
              )}
            >
              Select a file from the explorer
            </div>
          )}
        </div>
      </div>

      <footer
        className={cn(
          "flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          theme === "dark" ? "bg-[#070707]" : "bg-white",
        )}
      >
        <p
          className={cn(
            "text-xs",
            theme === "dark" ? "text-zinc-500" : "text-zinc-500",
          )}
        >
          These files are pulled from the public saas-template repository.
        </p>
        <a
          href={activePath ? `${REPO_URL}/blob/main/${activePath}` : REPO_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-xs hover:underline",
            theme === "dark"
              ? "text-zinc-400 hover:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          View on GitHub
          <ChevronRight className="size-3" aria-hidden />
        </a>
      </footer>
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          <span>Clone locally</span>
        </div>
        <CopyCommand command="npx create-deesse-app@latest my-saas-app" />
      </div>
    </div>
  )
}

function IconButton({
  children,
  className,
  theme,
  ...rest
}: {
  children: ReactNode
  className?: string
  theme: ThemeName
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-sm",
        theme === "dark"
          ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900",
        className,
      )}
    >
      {children}
    </button>
  )
}

export { ProjectExplorer }
