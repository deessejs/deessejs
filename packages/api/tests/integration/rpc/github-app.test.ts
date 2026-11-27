import { createHmac, randomUUID } from "node:crypto"
import { eq, inArray } from "drizzle-orm"
import { afterEach, describe, expect, it, vi } from "vitest"
import { inject } from "vitest"

import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import {
  githubAppInstallation,
  githubProject,
  githubProjectCheck,
  member,
  organization,
  session,
  user,
} from "@workspace/database/schema"
import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true
const SESSION_COOKIE_NAME = "better-auth.session_token"
const COMMIT = "a".repeat(40)

const github = vi.hoisted(() => ({
  state: "valid" as "valid" | "invalid" | "changed" | "inaccessible",
}))

vi.mock("../../../src/core/github-app/user-connection.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/core/github-app/user-connection.js")>()
  return { ...original, getGitHubUserAccessToken: async () => "test-access-token" }
})

let fixture = 0
const id = (prefix: string) => `${prefix}-${randomUUID()}-${fixture++}`
const users: string[] = []
const organizations: string[] = []

const authCookie = async (token: string) => {
  const signature = createHmac("sha256", (await auth.$context).options.secret)
    .update(token)
    .digest("base64")
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(`${token}.${signature}`)}`
}

const createActor = async () => {
  const actorId = id("github-app-user")
  await db.insert(user).values({
    id: actorId,
    name: actorId,
    email: `${actorId}@example.com`,
    emailVerified: true,
  })
  users.push(actorId)
  const token = id("session-token")
  await db.insert(session).values({
    id: id("session"),
    token,
    userId: actorId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })
  return { id: actorId, cookie: await authCookie(token) }
}

const createOrganization = async (ownerId: string) => {
  const orgId = id("github-app-org")
  const slug = id("org-slug")
  await db.insert(organization).values({ id: orgId, name: orgId, slug, createdAt: new Date() })
  organizations.push(orgId)
  await db.insert(member).values({ id: id("member"), organizationId: orgId, userId: ownerId, role: "owner", createdAt: new Date() })
  await db.insert(githubAppInstallation).values({
    id: id("installation-row"), organizationId: orgId, installationId: "12345",
    accountId: "67890", accountLogin: "example", accountType: "Organization", linkedByUserId: ownerId,
  })
  return { id: orgId, slug }
}

const response = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } })

const installRepositories = (state = github.state) => {
  github.state = state
  vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
    const url = new URL(String(input))
    if (url.pathname === "/user/installations/12345/repositories") {
      return response({
        total_count: state === "inaccessible" ? 0 : 1,
        repositories: state === "inaccessible" ? [] : [{
          id: 987, name: "project", full_name: "example/project", private: false,
          description: null, html_url: "https://github.com/example/project", default_branch: "main",
        }],
      })
    }
    if (url.pathname === "/repos/example/project/branches/main") {
      return response({ commit: { sha: state === "changed" ? "b".repeat(40) : COMMIT } })
    }
    if (url.pathname === "/repos/example/project/contents/deesse.json") {
      const config = state === "invalid" ? JSON.stringify({ formatVersion: 9 }) : JSON.stringify({ formatVersion: 1 })
      return response({ type: "file", path: "deesse.json", encoding: "base64", size: Buffer.byteLength(config), content: Buffer.from(config).toString("base64") })
    }
    throw new Error(`Unexpected GitHub request: ${url}`)
  }))
}

const rpc = async (procedure: string, data: unknown, cookie: string) => {
  const response = await api.request(`/api/v1/rpc/githubApp/${procedure}`, {
    method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ json: data }),
  })
  return { status: response.status, body: await response.json() as Record<string, unknown> }
}

afterEach(async () => {
  vi.unstubAllGlobals()
  const ownedUsers = users.splice(0)
  const ownedOrganizations = organizations.splice(0)
  if (ownedUsers.length) {
    const linked = await db.select({ id: organization.id }).from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id)).where(inArray(member.userId, ownedUsers))
    ownedOrganizations.push(...linked.map((row) => row.id))
    await db.delete(user).where(inArray(user.id, ownedUsers))
  }
  if (ownedOrganizations.length) await db.delete(organization).where(inArray(organization.id, ownedOrganizations))
})

describe.skipIf(!POSTGRES_READY)("GitHub App project import integration", () => {
  it("allows an owner to inspect and import a valid unchanged configuration", async () => {
    installRepositories()
    const owner = await createActor()
    const org = await createOrganization(owner.id)
    const inspected = await rpc("repositories/inspectConfiguration", { slug: org.slug, repositoryId: 987, page: 1 }, owner.cookie)
    expect(inspected.status).toBe(200)
    expect((inspected.body.json as { configuration: { status: string } }).configuration.status).toBe("valid")

    const imported = await rpc("repositories/import", { slug: org.slug, repositoryId: 987, page: 1, expectedCommitSha: COMMIT }, owner.cookie)
    expect(imported.status).toBe(200)
    const rows = await db.select().from(githubProject).where(eq(githubProject.organizationId, org.id))
    expect(rows).toHaveLength(1)
    const importedProject = rows[0]
    if (!importedProject) throw new Error("Expected imported project")
    const checks = await db.select().from(githubProjectCheck).where(eq(githubProjectCheck.projectId, importedProject.id))
    expect(checks).toHaveLength(1)
  })

  it("denies a non-managing member before contacting GitHub", async () => {
    const owner = await createActor()
    const memberActor = await createActor()
    const org = await createOrganization(owner.id)
    await db.insert(member).values({ id: id("member"), organizationId: org.id, userId: memberActor.id, role: "member", createdAt: new Date() })
    installRepositories()
    const result = await rpc("repositories/import", { slug: org.slug, repositoryId: 987, page: 1, expectedCommitSha: COMMIT }, memberActor.cookie)
    expect(result.status).toBe(403)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it("rejects repositories outside the installation and creates no project", async () => {
    installRepositories("inaccessible")
    const owner = await createActor()
    const org = await createOrganization(owner.id)
    const result = await rpc("repositories/import", { slug: org.slug, repositoryId: 987, page: 1, expectedCommitSha: COMMIT }, owner.cookie)
    expect(result.status).toBe(404)
    expect(await db.select().from(githubProject).where(eq(githubProject.organizationId, org.id))).toHaveLength(0)
  })

  it.each(["invalid", "changed"] as const)("does not import %s configuration", async (state) => {
    installRepositories(state)
    const owner = await createActor()
    const org = await createOrganization(owner.id)
    const result = await rpc("repositories/import", { slug: org.slug, repositoryId: 987, page: 1, expectedCommitSha: COMMIT }, owner.cookie)
    expect(result.status).toBe(409)
    expect(await db.select().from(githubProject).where(eq(githubProject.organizationId, org.id))).toHaveLength(0)
  })
})
