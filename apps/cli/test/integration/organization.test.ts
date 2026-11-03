import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockCreate, mockTemplateList, spinnerEvents } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockTemplateList: vi.fn(),
  spinnerEvents: [] as string[],
}))

vi.mock("ora", () => ({
  default: () => ({
    start() {
      spinnerEvents.push("start")
      return this
    },
    succeed() {
      spinnerEvents.push("success")
      return this
    },
    fail() {
      spinnerEvents.push("failure")
      return this
    },
  }),
}))

vi.mock("../../src/api/client.js", () => ({
  createAuthenticatedORPCClient: vi.fn(() => ({
    organization: {
      create: mockCreate,
      templates: { create: mockCreate, list: mockTemplateList },
    },
  })),
}))

import {
  organizationCommand,
  organizationErrorFromCode,
  completeBeforePrint,
} from "../../src/commands/organization.js"

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
    mockTemplateList.mockReset()
    spinnerEvents.length = 0
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

  it("lists every owned template and shows publication and review states in JSON", async () => {
    mockTemplateList.mockResolvedValue({
      templates: [
        {
          id: "1",
          slug: "draft",
          name: "Draft",
          description: "",
          owner: "acme",
          repo: "draft",
          category: "saas",
          labels: [],
          license: "MIT",
          canonicalUrl: "https://github.com/acme/draft",
          repositoryName: "draft",
          stars: null,
          fetchedAt: new Date().toISOString(),
          currentlyPublished: false,
          publication: null,
        },
        {
          id: "2",
          slug: "pending",
          name: "Pending",
          description: "",
          owner: "acme",
          repo: "pending",
          category: "saas",
          labels: [],
          license: "MIT",
          canonicalUrl: "https://github.com/acme/pending",
          repositoryName: "pending",
          stars: 1,
          fetchedAt: new Date().toISOString(),
          currentlyPublished: false,
          publication: {
            reviewStatus: "pending",
            publicationState: "unpublished",
            submittedAt: new Date().toISOString(),
            reviewReason: null,
          },
        },
        {
          id: "3",
          slug: "live",
          name: "Live",
          description: "",
          owner: "acme",
          repo: "live",
          category: "saas",
          labels: [],
          license: "MIT",
          canonicalUrl: "https://github.com/acme/live",
          repositoryName: "live",
          stars: 2,
          fetchedAt: new Date().toISOString(),
          currentlyPublished: true,
          publication: {
            reviewStatus: "approved",
            publicationState: "current",
            submittedAt: new Date().toISOString(),
            reviewReason: null,
          },
        },
      ],
    })
    await runCommand(["template", "list", "acme", "--json"])
    const result = JSON.parse(stdoutWrites.join(""))
    expect(result.templates).toHaveLength(3)
    expect(
      result.templates.map(
        (item: { publication: { reviewStatus: string } | null }) =>
          item.publication?.reviewStatus ?? "none"
      )
    ).toEqual(["none", "pending", "approved"])
    expect(mockTemplateList).toHaveBeenCalledWith({ organizationSlug: "acme" })
  })

  it("prints human publication states and resolves info from the organization list", async () => {
    mockTemplateList.mockResolvedValue({
      templates: [
        {
          id: "3",
          slug: "live",
          name: "Live",
          description: "",
          owner: "acme",
          repo: "live",
          category: "saas",
          labels: [],
          license: "MIT",
          canonicalUrl: "https://github.com/acme/live",
          repositoryName: "live",
          stars: 2,
          fetchedAt: new Date().toISOString(),
          currentlyPublished: true,
          publication: {
            reviewStatus: "approved",
            publicationState: "current",
            submittedAt: new Date().toISOString(),
            reviewReason: null,
          },
        },
      ],
    })
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    try {
      await runCommand(["template", "info", "acme", "live"])
      expect(log.mock.calls.flat().join(" ")).toContain(
        "Organization-owned template"
      )
      expect(log.mock.calls.flat().join(" ")).toContain(
        "Publication state: current"
      )
    } finally {
      log.mockRestore()
    }
  })

  it("creates through the authenticated organization template procedure", async () => {
    mockCreate.mockResolvedValue({
      id: "new",
      slug: "starter",
      name: "Starter",
    })
    await runCommand([
      "template",
      "add",
      "acme",
      "--slug",
      "starter",
      "--name",
      "Starter",
      "--repository",
      "https://github.com/acme/starter",
      "--category",
      "saas",
      "--json",
    ])
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationSlug: "acme",
        slug: "starter",
        repositoryUrl: "https://github.com/acme/starter",
        category: "saas",
        labels: [],
      })
    )
    expect(JSON.parse(stdoutWrites.join("")).publication).toBe("unpublished")
  })

  it("maps template API failures and managing-role denial to actionable CLI errors", () => {
    expect(
      organizationErrorFromCode("TEMPLATE_SLUG_CONFLICT")?.message
    ).toContain("already has a template")
    expect(
      organizationErrorFromCode("TEMPLATE_GITHUB_SOURCE_INVALID")?.message
    ).toContain("public GitHub")
    expect(
      organizationErrorFromCode("TEMPLATE_GITHUB_FETCH_FAILED")?.code
    ).toBe("network_error")
    expect(organizationErrorFromCode("ORGANIZATION_ACCESS_DENIED")?.code).toBe(
      "organization_not_found"
    )
  })

  it("parses repeated labels when add options precede the organization slug", async () => {
    mockCreate.mockResolvedValue({
      id: "new",
      slug: "starter",
      name: "Starter",
    })
    await runCommand([
      "template",
      "add",
      "--slug",
      "starter",
      "--name",
      "Starter",
      "--repository",
      "https://github.com/acme/starter",
      "--category",
      "saas",
      "--label",
      "nextjs",
      "--label",
      "auth",
      "acme",
      "--json",
    ])
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationSlug: "acme",
        labels: ["nextjs", "auth"],
      })
    )
  })

  it("completes the spinner before printing human-readable output", () => {
    const events: string[] = []
    completeBeforePrint(
      () => events.push("spinner-success"),
      () => events.push("human-output")
    )
    expect(events).toEqual(["spinner-success", "human-output"])
  })
})
