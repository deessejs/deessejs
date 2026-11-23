import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdminPage, type AdminPageProps } from "../src/next.js"

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ host: "localhost" })),
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

function ReportsPage() {
  return <p>Reports page content</p>
}

function createRuntime(role: string | undefined = "admin"): AdminPageProps["runtime"] {
  return {
    auth: {
      api: {
        getSession: vi.fn(async () => ({
          session: { id: "session-1" },
          user: { id: "user-1", email: "admin@example.test", role, name: "Ada" },
        })),
      },
    },
    admin: {
      pages: [
        { path: "", title: "Overview", component: ReportsPage },
        { path: "reports", title: "Reports", component: ReportsPage },
      ],
    },
  }
}

describe("AdminPage routing", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders the root page contributed by the admin plugin", async () => {
    const page = await AdminPage({ runtime: createRuntime(), path: "/" })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Overview")
    expect(html).toContain("href=\"/admin\"")
  })

  it("renders runtime-contributed page content, title, and navigation", async () => {
    const page = await AdminPage({ runtime: createRuntime(), path: "reports" })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Reports page content")
    expect(html).toContain("<h1 class=\"text-2xl font-semibold tracking-tight\">Reports</h1>")
    expect(html).toContain("href=\"/admin/reports\"")
    expect(html).toContain("aria-current=\"page\"")
  })

  it("uses Next.js notFound for unknown paths after the server role check", async () => {
    const runtime = createRuntime()

    await expect(AdminPage({ runtime, path: "missing" })).rejects.toThrow("NEXT_NOT_FOUND")
    expect(runtime.auth.api.getSession).toHaveBeenCalledTimes(1)
  })

  it("redirects anonymous visitors before resolving a page", async () => {
    const runtime = createRuntime()
    runtime.auth.api.getSession = vi.fn(async () => null)

    await expect(AdminPage({ runtime, path: "reports", signInPath: "/login" })).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  it("denies a signed-in non-admin before rendering a contributed page", async () => {
    const page = await AdminPage({ runtime: createRuntime("user"), path: "reports" })
    const html = renderToStaticMarkup(page)

    expect(html).toContain("Admin access required")
    expect(html).not.toContain("Reports page content")
  })
})
