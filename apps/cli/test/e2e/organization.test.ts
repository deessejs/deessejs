import { spawn } from "node:child_process"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { serve } from "@hono/node-server"
import { and, eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@workspace/database"
import { member, organization, session, user } from "@workspace/database/schema"

const cliDirectory = resolve(import.meta.dirname, "../..")
const users: string[] = []
const organizations: string[] = []
let home = ""
let server: ReturnType<typeof serve> | undefined
let apiUrl = ""
const originalNodeEnv = process.env.NODE_ENV

function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [join(cliDirectory, "dist/index.js"), ...args], {
      cwd: cliDirectory,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: home,
        USERPROFILE: home,
        NODE_ENV: "test",
        DEESSEJS_API_URL: apiUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    const timeout = setTimeout(() => child.kill("SIGKILL"), 15_000)
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk))
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk))
    child.once("error", reject)
    child.once("close", (code) => {
      clearTimeout(timeout)
      resolveResult({ code: code ?? 1, stdout, stderr })
    })
  })
}

async function createActor(): Promise<{ id: string; token: string }> {
  const id = `cli-e2e-${crypto.randomUUID()}`
  const token = `session-${crypto.randomUUID()}`
  await db.insert(user).values({ id, name: id, email: `${id}@example.test`, emailVerified: true })
  users.push(id)
  await db.insert(session).values({
    id: `session-row-${crypto.randomUUID()}`,
    token,
    userId: id,
    expiresAt: new Date(Date.now() + 60 * 60_000),
  })
  return { id, token }
}

describe("organization CLI against the real API", () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for organization CLI E2E")
    home = await mkdtemp(join(tmpdir(), "deessejs-org-cli-e2e-"))
    process.env.NODE_ENV = "development"
    const { api } = await import("@workspace/api")
    const address = await new Promise<{ port: number }>((resolveAddress, reject) => {
      try {
        server = serve({ fetch: api.fetch, hostname: "127.0.0.1", port: 0 }, resolveAddress)
        server.once("error", reject)
      } catch (error) {
        reject(error)
      }
    })
    apiUrl = `http://127.0.0.1:${address.port}`
  }, 15_000)

  afterAll(async () => {
    try {
      const runningServer = server
      if (runningServer) {
        await new Promise<void>((resolveClose, reject) =>
          runningServer.close((error) =>
            error ? reject(error) : resolveClose()
          )
        )
      }
      if (users.length) await db.delete(user).where(inArray(user.id, users))
      if (organizations.length) await db.delete(organization).where(inArray(organization.id, organizations))
    } finally {
      if (home) await rm(home, { recursive: true, force: true })
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = originalNodeEnv
    }
  })

  it("creates, lists, and resolves organization info through a bearer session", async () => {
    const actor = await createActor()
    await mkdir(join(home, ".deessejs"), { recursive: true })
    await writeFile(join(home, ".deessejs/auth.json"), JSON.stringify({
      access_token: actor.token,
      user: { id: actor.id, name: actor.id, email: `${actor.id}@example.test` },
      fetchedAt: new Date().toISOString(),
    }))

    const created = await runCli(["organization", "create", `CLI E2E ${actor.id}`, "--json"])
    expect(created.code, created.stderr).toBe(0)
    const createdJson = JSON.parse(created.stdout) as { organization: { id: string; slug: string } }
    const org = createdJson.organization
    expect(org.id).toBeTruthy()
    organizations.push(org.id)
    const rows = await db.select().from(member).where(and(eq(member.organizationId, org.id), eq(member.userId, actor.id)))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.role).toBe("owner")

    for (const [args, key] of [
      [["organization", "list", "--json"], "organizations"],
      [["organization", "info", org.slug, "--json"], "organization"],
    ] as const) {
      const result = await runCli([...args])
      expect(result.code, result.stderr).toBe(0)
      const output = JSON.parse(result.stdout) as Record<string, unknown>
      if (key === "organizations") expect(output.organizations).toEqual(expect.arrayContaining([expect.objectContaining({ id: org.id, slug: org.slug })]))
      else expect(output.organization).toEqual(expect.objectContaining({ id: org.id, slug: org.slug, role: "owner" }))
    }

    const stranger = await createActor()
    const strangerHome = await mkdtemp(join(tmpdir(), "deessejs-org-stranger-"))
    try {
      await mkdir(join(strangerHome, ".deessejs"), { recursive: true })
      await writeFile(join(strangerHome, ".deessejs/auth.json"), JSON.stringify({ access_token: stranger.token, user: { id: stranger.id }, fetchedAt: new Date().toISOString() }))
      const originalHome = home
      home = strangerHome
      const hidden = await runCli(["organization", "info", org.slug, "--json"])
      home = originalHome
      expect(hidden.code).not.toBe(0)
    } finally {
      await rm(strangerHome, { recursive: true, force: true })
    }
  }, 60_000)
})
