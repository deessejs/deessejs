import { memoryAdapter } from "@better-auth/memory-adapter"
import { describe, expect, it } from "vitest"
import { createDeesse, plugin, type DatabaseAdapter, type DeesseDatabaseService } from "../src/index.js"

const database = {
  database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
  authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
} satisfies DatabaseAdapter

const auth = {
  baseURL: "http://localhost",
  secret: "deesse-admin-composition-test-secret-long-enough",
}

function Overview() {
  return "overview"
}

function Reports() {
  return "reports"
}

describe("Deesse admin page composition", () => {
  it("composes statically registered pages from the runtime plugin list", () => {
    const admin = plugin({
      id: "admin",
      handler: () => ({
        admin: { pages: [{ path: "/", title: "Overview", component: Overview }] as const },
      }),
    })
    const reports = plugin({
      id: "reports",
      requires: ["admin"],
      handler: () => ({
        admin: { pages: [{ path: "reports", title: "Reports", component: Reports }] as const },
      }),
    })

    const runtime = createDeesse({ database, auth, plugins: [reports(), admin()] })

    expect(runtime.admin.pages.map(({ path, title }) => ({ path, title }))).toEqual([
      { path: "", title: "Overview" },
      { path: "reports", title: "Reports" },
    ])
    expect(runtime.admin.pages[1]?.component).toBe(Reports)
  })

  it("rejects duplicate and invalid admin page paths during composition", () => {
    const first = plugin({
      id: "first",
      handler: () => ({ admin: { pages: [{ path: "/reports/", title: "Reports", component: Reports }] } }),
    })
    const duplicate = plugin({
      id: "duplicate",
      handler: () => ({ admin: { pages: [{ path: "reports", title: "Other reports", component: Overview }] } }),
    })
    const invalid = plugin({
      id: "invalid",
      handler: () => ({ admin: { pages: [{ path: "../users", title: "Users", component: Overview }] } }),
    })

    expect(() => createDeesse({ database, auth, plugins: [first(), duplicate()] })).toThrow(
      "Plugin duplicate contributes a duplicate admin page path: reports",
    )
    expect(() => createDeesse({ database, auth, plugins: [invalid()] })).toThrow(
      "Plugin invalid contributes an invalid admin page path: ../users",
    )
  })
})
