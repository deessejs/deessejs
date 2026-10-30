import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock("../../src/api/client.js", () => ({
  createAuthenticatedORPCClient: vi.fn(() => ({
    organization: { create: mockCreate },
  })),
}))

import { organizationCommand } from "../../src/commands/organization.js"

const originalHome = process.env.HOME
const originalUserProfile = process.env.USERPROFILE
const originalApiUrl = process.env.DEESSEJS_API_URL
let home: string
let stdoutWrites: string[]
let stdoutSpy: ReturnType<typeof vi.spyOn>

function seedAuth(): void {
  const directory = join(home, ".deessejs")
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, "auth.json"),
    JSON.stringify({
      access_token: "tok_org_test",
      user: { id: "user_1", name: "Test User" },
      fetchedAt: new Date().toISOString(),
    })
  )
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

async function runCommand(args: string[]) {
  await organizationCommand.parseAsync(args, { from: "user" })
}

describe("organization commands", () => {
  beforeEach(() => {
    home = join(tmpdir(), `cli-organization-${Date.now()}-${Math.random()}`)
    process.env.HOME = home
    process.env.USERPROFILE = home
    process.env.DEESSEJS_API_URL = "https://api.example.test"
    seedAuth()
    stdoutWrites = []
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        stdoutWrites.push(chunk.toString())
        return true
      })
    mockCreate.mockReset()
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    vi.unstubAllGlobals()
    process.env.HOME = originalHome
    process.env.USERPROFILE = originalUserProfile
    process.env.DEESSEJS_API_URL = originalApiUrl
    rmSync(home, { recursive: true, force: true })
  })

  it("lists an empty membership set using the signed-in bearer token", async () => {
    const requests: Array<{ url: URL; authorization: string | null }> = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input.toString())
        requests.push({
          url,
          authorization: new Headers(init?.headers).get("authorization"),
        })
        return response([])
      })
    )

    await runCommand(["list", "--json"])

    expect(JSON.parse(stdoutWrites.join(""))).toEqual({ organizations: [] })
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url.pathname).toBe("/api/v1/auth/organization/list")
    expect(requests[0]?.authorization).toBe("Bearer tok_org_test")
  })

  it("resolves info only through the caller's memberships and gets its role", async () => {
    const requests: URL[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = new URL(input.toString())
        requests.push(url)
        if (url.pathname.endsWith("/organization/list")) {
          return response([
            {
              id: "org_1",
              name: "Acme Studio",
              slug: "acme-studio",
              logo: null,
            },
          ])
        }
        if (url.pathname.endsWith("/organization/get-active-member-role")) {
          return response({ role: "owner" })
        }
        return response({ error: "not_found" }, 404)
      })
    )

    await runCommand(["info", "acme-studio", "--json"])

    expect(JSON.parse(stdoutWrites.join(""))).toEqual({
      organization: {
        id: "org_1",
        name: "Acme Studio",
        slug: "acme-studio",
        logo: null,
        role: "owner",
      },
    })
    expect(requests.map((url) => url.pathname)).toEqual([
      "/api/v1/auth/organization/list",
      "/api/v1/auth/organization/get-active-member-role",
    ])
    expect(requests[1]?.searchParams.get("organizationId")).toBe("org_1")
  })

  it("reports an inaccessible role lookup without exposing the organization", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ message: "Forbidden" }, 403))
    )

    await expect(
      (await import("../../src/api/organizations.js")).getOrganizationRole(
        "org_private",
        "tok_org_test"
      )
    ).rejects.toMatchObject({ code: "organization_not_found" })
  })

  it("creates through the authenticated provisioning client with a proposed slug", async () => {
    mockCreate.mockResolvedValue({
      id: "org_new",
      name: "Acme Studio",
      slug: "acme-studio-2",
    })

    await runCommand(["create", "Acme Studio", "--json"])

    expect(mockCreate).toHaveBeenCalledWith({
      name: "Acme Studio",
      slug: "acme-studio",
    })
    expect(JSON.parse(stdoutWrites.join(""))).toEqual({
      organization: {
        id: "org_new",
        name: "Acme Studio",
        slug: "acme-studio-2",
      },
    })
  })
})
