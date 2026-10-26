/**
 * Integration test for the organization procedures.
 *
 * @testClass integration
 *
 * These are the load-bearing tests of the organization access rule.
 * They exercise the real `api` Hono object through `api.request()`,
 * against the URL the `RPCLink` client actually sends, so the session
 * resolution, the procedure middleware and the procedure all run for
 * real. The rule is what has to be proven, and a test that asserts the
 * refusals pins them in a way a manual visit cannot.
 *
 * The test needs a reachable Postgres: the membership read and the
 * session lookup both go to the database. It is gated on
 * `inject('postgres:ready')` and skips loudly when Postgres is not
 * there, so a misconfigured CI is visible in the log aggregator.
 *
 * The fixtures are written straight to the tables. The session cookie
 * is signed the way Better Auth signs it — the token, a dot, and the
 * base64 HMAC of the token under the auth secret — so the request
 * travels the same path a browser's would, and a session row is the
 * only thing that has to exist for the caller to be a caller.
 */
import { createHmac, randomUUID } from "node:crypto"
import { and, eq, inArray } from "drizzle-orm"
import postgres from "postgres"
import { afterEach, describe, expect, it, vi } from "vitest"
import { inject } from "vitest"

import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import {
  member,
  organization,
  organizationProvisioning,
  session,
  user,
} from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"

import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

const SESSION_COOKIE_NAME = "better-auth.session_token"

/**
 * How the creation behaves when the test needs it to fail, or to
 * wait.
 *
 * The plugin's create writes the organization, then its membership,
 * then the active selection, and there is no way to make the
 * membership insertion fail from the outside. The compensation and
 * the reconciliation are the code under test, so the test replaces
 * the wrapper and drives the failure it needs.
 *
 * The active selection can also be held, so the test can observe the
 * account while a recovery is running.
 */
const wrapper = vi.hoisted(() => {
  let markEntered: () => void = () => {}
  let release: () => void = () => {}
  const entered = new Promise<void>((resolve) => {
    markEntered = resolve
  })
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    mode: "real" as "real" | "fail-before" | "fail-after",
    setActive: "real" as "real" | "hold" | "fail",
    markEntered,
    release,
    entered,
    gate,
  }
})

vi.mock("@workspace/auth/organization/create", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@workspace/auth/organization/create")>()
  return {
    ...original,
    createOrganization: async (input: {
      name: string
      slug: string
      marker: string
      headers: Headers
    }) => {
      if (wrapper.mode === "fail-before") {
        throw new Error("The creation failed before it wrote anything.")
      }
      if (wrapper.mode === "fail-after") {
        const { db: database } = await import("@workspace/database")
        const { organization: organizations } = await import(
          "@workspace/database/schema"
        )
        await database
          .insert(organizations)
          .values({
            id: `org-mock-${randomUUID()}`,
            name: input.name,
            slug: input.slug,
            createdAt: new Date(),
            metadata: JSON.stringify({ provisioningAttempt: input.marker }),
          })
        throw new Error("The creation failed after it wrote the organization.")
      }
      return original.createOrganization(input)
    },
    setActiveOrganization: async (input: {
      organizationId: string
      headers: Headers
    }) => {
      if (wrapper.setActive === "fail") {
        throw new Error("The active selection could not be restored.")
      }
      if (wrapper.setActive === "hold") {
        wrapper.markEntered()
        await wrapper.gate
      }
      return original.setActiveOrganization(input)
    },
  }
})

let counter = 0

const uniqueId = (prefix: string): string =>
  `${prefix}-${randomUUID().slice(0, 8)}-${counter++}`

/**
 * The rows this file creates, so they can be removed afterwards.
 *
 * The database is not necessarily disposable: a local container
 * outlives the run, and repeated runs accumulate. The references
 * cascade, so removing the users and the organizations removes the
 * sessions, the members and the provisioning operations with them.
 */
const createdUsers: string[] = []
const createdOrganizations: string[] = []

afterEach(async () => {
  wrapper.mode = "real"
  wrapper.setActive = "real"
  wrapper.release()
  const users = createdUsers.splice(0)
  const organizations = createdOrganizations.splice(0)
  if (users.length > 0) {
    // The organizations the flow created for these accounts are
    // found through the membership, before the membership goes with
    // the user.
    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id))
      .where(inArray(member.userId, users))
    for (const row of rows) organizations.push(row.id)
    await db.delete(user).where(inArray(user.id, users))
  }
  if (organizations.length > 0) {
    await db.delete(organization).where(inArray(organization.id, organizations))
  }
})

/**
 * The secret the server signs its cookies with.
 *
 * Better Auth resolves the secret from the configuration and falls back
 * to a default of its own when none is set, so the test reads the
 * resolved value off the auth instance rather than off the
 * environment. A test that signed with a different secret would produce
 * a cookie the server rejects, which is a confusing way to fail.
 */
const authSecret = async (): Promise<string> => {
  const context = await auth.$context
  return context.options.secret
}

/**
 * The session cookie, signed the way Better Auth signs it.
 *
 * The value is the session token, a dot, and the base64 HMAC-SHA256 of
 * the token under the auth secret. Better Auth verifies the signature
 * and then looks the token up in the `session` table.
 */
const sessionCookie = async (token: string): Promise<string> => {
  const signature = createHmac("sha256", await authSecret())
    .update(token)
    .digest("base64")
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(`${token}.${signature}`)}`
}

type Actor = {
  id: string
  email: string
  cookie: string
}

/** Creates a user and a session for it, and returns the caller's cookie. */
const createActor = async (
  activeOrganizationId?: string,
  emailVerified = true,
): Promise<Actor> => {
  const id = uniqueId("user")
  const email = `${id}@example.com`
  await db.insert(user).values({
    id,
    name: id,
    email,
    emailVerified,
  })
  createdUsers.push(id)
  const token = uniqueId("token")
  await db.insert(session).values({
    id: uniqueId("session"),
    token,
    userId: id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    activeOrganizationId: activeOrganizationId ?? null,
  })
  return { id, email, cookie: await sessionCookie(token) }
}

type CreatedOrganization = { id: string; slug: string }

/** Creates an organization nobody belongs to yet. */
const createOrganization = async (name = "Acme"): Promise<CreatedOrganization> => {
  const id = uniqueId("org")
  const slug = uniqueId("acme")
  await db.insert(organization).values({
    id,
    name,
    slug,
    createdAt: new Date(),
  })
  createdOrganizations.push(id)
  return { id, slug }
}

/** Creates an organization under an exact slug, and tracks it. */
const createOrganizationWithSlug = async (
  name: string,
  slug: string,
): Promise<CreatedOrganization> => {
  const id = uniqueId("org")
  await db.insert(organization).values({
    id,
    name,
    slug,
    createdAt: new Date(),
  })
  createdOrganizations.push(id)
  return { id, slug }
}

/** Creates an organization that carries a marker, and tracks it. */
const createMarkedOrganization = async (input: {
  name: string
  slug: string
  marker: string
}): Promise<CreatedOrganization> => {
  const id = uniqueId("org")
  await db.insert(organization).values({
    id,
    name: input.name,
    slug: input.slug,
    createdAt: new Date(),
    metadata: JSON.stringify({ provisioningAttempt: input.marker }),
  })
  createdOrganizations.push(id)
  return { id, slug: input.slug }
}

/** Adds a member with the given role. The role is stored as Better Auth stores it. */
const addMember = async (
  organizationId: string,
  userId: string,
  role: string,
): Promise<void> => {
  await db.insert(member).values({
    id: uniqueId("member"),
    organizationId,
    userId,
    role,
    createdAt: new Date(),
  })
}

/** Records a provisioning operation, pending or not. */
const createOperation = async (input: {
  id: string
  userId: string
  name: string
  slug: string
  ageMs?: number
}): Promise<void> => {
  const createdAt = new Date(Date.now() - (input.ageMs ?? 0))
  await db.insert(organizationProvisioning).values({
    id: input.id,
    userId: input.userId,
    name: input.name,
    slug: input.slug,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  })
}

type RpcResult = { status: number; body: Record<string, unknown> }

/** Calls a procedure the way the oRPC client does. */
const rpc = async (
  path: string[],
  data: unknown,
  cookie?: string,
): Promise<RpcResult> => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  }
  if (cookie) headers.cookie = cookie
  const res = await api.request(`/api/v1/rpc/${path.join("/")}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: data }),
  })
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

/** The error carried by a refused call. */
const errorOf = (body: Record<string, unknown>) =>
  body.json as { code: string; status: number; message: string }

/** The organization the session points at, read back from the table. */
const activeOrganizationIdOf = async (
  userId: string,
): Promise<string | null> => {
  const rows = await db
    .select({ activeOrganizationId: session.activeOrganizationId })
    .from(session)
    .where(eq(session.userId, userId))
    .limit(1)
  return rows[0]?.activeOrganizationId ?? null
}

/** The marker the organization carries, read back from its own row. */
const markerOf = async (organizationId: string): Promise<string | null> => {
  const rows = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)
  const raw = rows[0]?.metadata ?? null
  if (raw === null) return null
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== "object" || parsed === null) return null
  const marker = (parsed as Record<string, unknown>).provisioningAttempt
  return typeof marker === "string" ? marker : null
}

/** The code an error carries, when it carries one. */
const codeOfError = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null) return null
  if ("code" in error && typeof error.code === "string") return error.code
  // The driver error is often the cause of the error the caller
  // sees, not the error itself.
  if ("cause" in error) return codeOfError(error.cause)
  return null
}

/** Calls one of the native auth endpoints. */
const native = async (
  path: string,
  body: unknown,
  cookie: string,
): Promise<{ status: number }> => {
  const res = await api.request(`/api/v1/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  })
  return { status: res.status }
}

describe("organization procedures", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] the organization procedures need a reachable Postgres", () => {
      // Loud skip: the test name carries the [skip-postgres] annotation
      // and the global setup emits a WARN. A misconfigured CI is visible.
    })
  } else {
    it("refuses an anonymous caller", async () => {
      const org = await createOrganization()
      const res = await rpc(["organization", "bySlug"], { slug: org.slug })

      expect(res.status).toBe(401)
      expect(errorOf(res.body).code).toBe("UNAUTHORIZED")
    })

    it("returns the organization to a member, with their real role", async () => {
      const actor = await createActor()
      const org = await createOrganization()
      await addMember(org.id, actor.id, "owner")

      const res = await rpc(
        ["organization", "bySlug"],
        { slug: org.slug },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect(res.body.json).toEqual({
        id: org.id,
        slug: org.slug,
        name: "Acme",
        role: "owner",
      })
    })

    it("refuses a caller who does not belong to the organization", async () => {
      const actor = await createActor()
      const org = await createOrganization()

      const res = await rpc(
        ["organization", "bySlug"],
        { slug: org.slug },
        actor.cookie,
      )

      expect(res.status).toBe(403)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_ACCESS_DENIED")
    })

    it("answers an unknown slug exactly like a forbidden one", async () => {
      const actor = await createActor()
      const org = await createOrganization()

      const forbidden = await rpc(
        ["organization", "bySlug"],
        { slug: org.slug },
        actor.cookie,
      )
      const unknown = await rpc(
        ["organization", "bySlug"],
        { slug: uniqueId("acme") },
        actor.cookie,
      )

      expect(unknown.status).toBe(forbidden.status)
      // The body, not merely the status. A status-only assertion would
      // pass on an implementation that leaks the existence of the
      // organization through the message.
      expect(unknown.body.json).toEqual(forbidden.body.json)
    })

    it("refuses a plain member on the settings procedure", async () => {
      const actor = await createActor()
      const org = await createOrganization()
      await addMember(org.id, actor.id, "member")

      const res = await rpc(
        ["organization", "settings"],
        { slug: org.slug },
        actor.cookie,
      )

      expect(res.status).toBe(403)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_ACCESS_DENIED")
    })

    it("serves the settings procedure to an admin and to an owner", async () => {
      for (const role of ["admin", "owner"]) {
        const actor = await createActor()
        const org = await createOrganization()
        await addMember(org.id, actor.id, role)

        const res = await rpc(
          ["organization", "settings"],
          { slug: org.slug },
          actor.cookie,
        )

        expect(res.status).toBe(200)
        expect(res.body.json).toMatchObject({ id: org.id, role })
      }
    })

    it("serves the settings procedure to a member who holds several roles", async () => {
      for (const role of ["admin,owner", "member,admin"]) {
        const actor = await createActor()
        const org = await createOrganization()
        await addMember(org.id, actor.id, role)

        const res = await rpc(
          ["organization", "settings"],
          { slug: org.slug },
          actor.cookie,
        )

        expect(res.status).toBe(200)
        expect(res.body.json).toMatchObject({ id: org.id, role })
      }
    })

    it("reports no active organization when the session has none", async () => {
      const actor = await createActor()

      const res = await rpc(["organization", "active"], null, actor.cookie)

      expect(res.status).toBe(200)
      expect(res.body.json).toEqual({ status: "none" })
    })

    it("reports the active organization to a member of it", async () => {
      const org = await createOrganization()
      const actor = await createActor(org.id)
      await addMember(org.id, actor.id, "admin")

      const res = await rpc(["organization", "active"], null, actor.cookie)

      expect(res.status).toBe(200)
      expect(res.body.json).toEqual({
        status: "active",
        organization: { id: org.id, slug: org.slug, name: "Acme" },
        role: "admin",
      })
    })

    it("reports a stale selection when the caller has left the organization", async () => {
      const org = await createOrganization()
      const actor = await createActor(org.id)
      await addMember(org.id, actor.id, "owner")
      await db
        .delete(member)
        .where(
          and(eq(member.organizationId, org.id), eq(member.userId, actor.id)),
        )

      const res = await rpc(["organization", "active"], null, actor.cookie)

      expect(res.status).toBe(200)
      expect(res.body.json).toEqual({ status: "stale" })
    })

    it("leaves the active organization alone when a refused read happens", async () => {
      const mine = await createOrganization()
      const theirs = await createOrganization()
      const actor = await createActor(mine.id)
      await addMember(mine.id, actor.id, "owner")

      const res = await rpc(
        ["organization", "bySlug"],
        { slug: theirs.slug },
        actor.cookie,
      )
      expect(res.status).toBe(403)

      // The caller is still a member of their own organization, so
      // their selection is still theirs. A read that took it away
      // would be a read that changed the state it was checking.
      expect(await activeOrganizationIdOf(actor.id)).toBe(mine.id)
    })

    it("answers a malformed slug with a validation error, not a refusal", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "bySlug"],
        { slug: 42 },
        actor.cookie,
      )

      expect(res.status).toBe(400)
      expect(errorOf(res.body).code).toBe("BAD_REQUEST")
    })

    it("does not serve the native organization read endpoints", async () => {
      const org = await createOrganization()
      const actor = await createActor(org.id)
      await addMember(org.id, actor.id, "owner")

      for (const endpoint of [
        "get-organization",
        "get-full-organization",
      ]) {
        const res = await api.request(
          `/api/v1/auth/organization/${endpoint}?organizationSlug=${org.slug}`,
          { headers: { cookie: actor.cookie } },
        )

        expect(res.status).toBe(404)
        // And the read left the session alone. The endpoints these
        // replace cleared the caller's active organization when the
        // caller was not a member, and they did it on a GET, which the
        // origin check does not cover.
        expect(await activeOrganizationIdOf(actor.id)).toBe(org.id)
      }
    })
  }
})

describe("organization creation", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] the creation needs a reachable Postgres", () => {
      // Loud skip, as above.
    })
  } else {
    it("refuses an anonymous caller", async () => {
      const res = await rpc(["organization", "create"], { name: "Acme" })

      expect(res.status).toBe(401)
      expect(errorOf(res.body).code).toBe("UNAUTHORIZED")
    })

    it("creates an organization, and the caller owns it", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      const body = res.body.json as {
        id: string
        slug: string
        name: string
        role: string
      }
      expect(body.name).toBe("Acme")
      expect(body.role).toBe("owner")
      // The slug is the server's.
      expect(body.slug).toBe("acme")
      expect(body.id).toEqual(expect.any(String))
    })

    it("gives a one-character name a slug the format accepts", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: "A" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { slug: string }).slug).toMatch(
        /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/,
      )
    })

    it("gives a name the normalizer strips a slug the format accepts", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: "日本語" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { slug: string }).slug).toMatch(
        /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/,
      )
    })

    it("refuses a name the policy rejects", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: " Acme " },
        actor.cookie,
      )

      expect(res.status).toBe(400)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_NAME_INVALID")
    })

    it("retries a taken slug and creates a different one", async () => {
      const actor = await createActor()
      // The organization owns the slug the flow would try first.
      await createOrganizationWithSlug("Acme", "acme")

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { slug: string }).slug).toBe("acme-2")
    })

    it("never takes a reserved slug", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: "Admin" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { slug: string }).slug).not.toBe("admin")
    })

    it("ignores a slug the caller sends", async () => {
      const actor = await createActor()

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme", slug: "chosen-by-the-caller" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { slug: string }).slug).toBe("acme")
    })

    it("makes the new organization the active one", async () => {
      const actor = await createActor()

      const created = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )
      const organizationId = (created.body.json as { id: string }).id

      const res = await rpc(["organization", "active"], null, actor.cookie)

      expect(res.status).toBe(200)
      expect(res.body.json).toMatchObject({
        status: "active",
        organization: { id: organizationId, slug: "acme" },
      })
    })

    it("gives up after the last candidate and creates nothing", async () => {
      const actor = await createActor()
      // Every candidate the flow would try is taken.
      const candidates = [
        "acme",
        "acme-2",
        "acme-3",
        "acme-4",
        "acme-5",
        "acme-6",
        "acme-7",
        "acme-8",
        "acme-9",
        "acme-10",
      ]
      for (const candidate of candidates) {
        await createOrganizationWithSlug("Acme", candidate)
      }

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(500)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_CREATE_FAILED")

      // And no eleventh organization.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(candidates.length)
    })

    it("does not serve the native create endpoint", async () => {
      const actor = await createActor()

      const res = await native(
        "/organization/create",
        { name: "Acme", slug: "acme-native" },
        actor.cookie,
      )

      expect(res.status).toBe(404)
    })

    it("refuses an account that has not verified its email", async () => {
      const actor = await createActor(undefined, false)

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(403)
      expect(errorOf(res.body).code).toBe(
        "ORGANIZATION_EMAIL_VERIFICATION_REQUIRED",
      )
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("leaves an organization it did not create intact", async () => {
      const actor = await createActor()
      // The organization owns the slug the flow would try.
      const existing = await createOrganizationWithSlug("Acme", "acme")
      wrapper.mode = "fail-before"

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(500)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_CREATE_FAILED")

      // The organization that owns the candidate slug is still there,
      // with its slug. A deletion by slug would have destroyed it.
      const rows = await db
        .select({ slug: organization.slug, name: organization.name })
        .from(organization)
        .where(eq(organization.id, existing.id))
      expect(rows).toEqual([{ slug: "acme", name: "Acme" }])
    })

    it("removes the organization a failed create wrote", async () => {
      const actor = await createActor()
      wrapper.mode = "fail-after"

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(500)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_CREATE_FAILED")

      // The organization this attempt wrote is gone, and the slug is
      // free again.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("creates exactly one organization when a failed create is retried", async () => {
      const actor = await createActor()
      wrapper.mode = "fail-after"
      await rpc(["organization", "create"], { name: "Acme" }, actor.cookie)

      wrapper.mode = "real"
      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      const rows = await db
        .select({ slug: organization.slug })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toEqual([{ slug: "acme" }])
    })

    it("adopts an organization an interrupted attempt completed", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
        ageMs: 10 * 60 * 1000,
      })
      const orphan = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })
      await addMember(orphan.id, actor.id, "owner")

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { id: string }).id).toBe(orphan.id)

      // No second organization.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(1)

      // And the session points at the adopted organization, so the
      // next entry point does not send the caller back to the empty
      // state.
      const active = await rpc(["organization", "active"], null, actor.cookie)
      expect(active.body.json).toMatchObject({
        status: "active",
        organization: { id: orphan.id },
      })
    })

    it("removes an organization an interrupted attempt left without a membership", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
        ageMs: 10 * 60 * 1000,
      })
      const orphan = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { id: string }).id).not.toBe(orphan.id)

      // The orphan is gone, and only the new organization is left.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(1)
      expect(rows[0]?.id).not.toBe(orphan.id)
    })

    it("refuses a second attempt while another one is running", async () => {
      const actor = await createActor()
      await createOperation({
        id: uniqueId("op"),
        userId: actor.id,
        name: "Acme",
        slug: "acme",
      })

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(409)
      expect(errorOf(res.body).code).toBe("ORGANIZATION_CREATE_IN_PROGRESS")
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("carries the marker on the organization's own row", async () => {
      const actor = await createActor()

      const created = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )
      const organizationId = (created.body.json as { id: string }).id

      const marker = await markerOf(organizationId)
      expect(marker).toEqual(expect.any(String))

      // The marker names the operation that produced it.
      const rows = await db
        .select({ id: organizationProvisioning.id })
        .from(organizationProvisioning)
        .where(eq(organizationProvisioning.userId, actor.id))
      expect(rows.map((row) => row.id)).toContain(marker)
    })

    it("refuses a creation whose marker names no pending operation", async () => {
      const actor = await createActor()
      const { createOrganization: createThroughPlugin } = await import(
        "@workspace/auth/organization/create"
      )

      await expect(
        createThroughPlugin({
          name: "Acme",
          slug: uniqueId("acme"),
          marker: uniqueId("op"),
          headers: new Headers({ cookie: actor.cookie }),
        }),
      ).rejects.toThrow()

      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("refuses a creation whose operation was taken over", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
      })
      await db
        .update(organizationProvisioning)
        .set({ status: "superseded" })
        .where(eq(organizationProvisioning.id, operationId))

      const { createOrganization: createThroughPlugin } = await import(
        "@workspace/auth/organization/create"
      )
      await expect(
        createThroughPlugin({
          name: "Acme",
          slug: "acme",
          marker: operationId,
          headers: new Headers({ cookie: actor.cookie }),
        }),
      ).rejects.toThrow()

      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("refuses an insert whose operation was taken over after the check", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      const slug = uniqueId("acme")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug,
      })

      // Two connections: the transaction holds one, and the wait polls
      // the database's lock view on the other.
      const pool = postgres(serverEnv.DATABASE_URL, {
        prepare: false,
        max: 4,
      })
      const holder: {
        settled: Promise<{ ok: boolean; error?: unknown }> | null
      } = { settled: null }

      try {
        await pool.begin(async (tx) => {
          // The lock the guard takes. The creation blocks on it.
          await tx`SELECT id FROM organization_provisioning WHERE id = ${operationId} FOR UPDATE`

          const { createOrganization: createThroughPlugin } = await import(
            "@workspace/auth/organization/create"
          )
          const creation = createThroughPlugin({
            name: "Acme",
            slug,
            marker: operationId,
            headers: new Headers({ cookie: actor.cookie }),
          })
          // The refusal is handled as it happens, not after the
          // transaction closed: a rejection nobody is waiting for yet
          // is an unhandled one.
          holder.settled = creation.then(
            () => ({ ok: true }),
            (error: unknown) => ({ ok: false, error }),
          )

          // The creation is inside the guard's lock when it is
          // waiting for it.
          await waitForBlockedInsert(pool)

          await tx`UPDATE organization_provisioning SET status = 'superseded' WHERE id = ${operationId}`
        })
      } finally {
        await pool.end()
      }

      expect(holder.settled).not.toBeNull()
      const outcome = await holder.settled
      expect(outcome.ok).toBe(false)
      // The refusal is the guard's, and it carries the SQLSTATE the
      // database raises it with.
      expect(codeOfError(outcome.error)).toBe("D0001")

      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(0)
    })

    it("refuses an update that would take the marker away", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
      })
      const org = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })
      await addMember(org.id, actor.id, "owner")

      const res = await native(
        "/organization/update",
        { organizationId: org.id, data: { metadata: { takeover: true } } },
        actor.cookie,
      )

      expect(res.status).toBe(403)
      expect(await markerOf(org.id)).toBe(operationId)
    })

    it("refuses a second creation while a recovery is running", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
        ageMs: 10 * 60 * 1000,
      })
      const orphan = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })
      await addMember(orphan.id, actor.id, "owner")

      // The recovery restores the active selection, and the write is
      // held, so the test can look at the account while the recovery
      // is running.
      wrapper.setActive = "hold"
      const first = rpc(["organization", "create"], { name: "Acme" }, actor.cookie)
      await wrapper.entered

      // The operation is superseded, and the account's unique index
      // still covers it, so the second attempt does not start.
      const second = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )
      expect(second.status).toBe(409)
      expect(errorOf(second.body).code).toBe("ORGANIZATION_CREATE_IN_PROGRESS")

      wrapper.release()
      const firstResult = await first
      expect(firstResult.status).toBe(200)
      expect((firstResult.body.json as { id: string }).id).toBe(orphan.id)

      // And the account holds one organization, not two.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(1)
    })

    it("takes over a recovery that was left behind", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
        ageMs: 10 * 60 * 1000,
      })
      const orphan = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })
      await addMember(orphan.id, actor.id, "owner")
      // The attempt was fenced out and its recovery died before it
      // finished. The operation still holds the account, so the next
      // attempt has to claim it before it can start its own.
      await db
        .update(organizationProvisioning)
        .set({ status: "superseded" })
        .where(eq(organizationProvisioning.id, operationId))

      const res = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )

      expect(res.status).toBe(200)
      expect((res.body.json as { id: string }).id).toBe(orphan.id)

      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(1)
    })

    it("adopts the same organization again after a failed adoption", async () => {
      const actor = await createActor()
      const operationId = uniqueId("op")
      await createOperation({
        id: operationId,
        userId: actor.id,
        name: "Acme",
        slug: "acme",
        ageMs: 10 * 60 * 1000,
      })
      const orphan = await createMarkedOrganization({
        name: "Acme",
        slug: "acme",
        marker: operationId,
      })
      await addMember(orphan.id, actor.id, "owner")

      // The active selection cannot be restored.
      wrapper.setActive = "fail"
      const failed = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )
      expect(failed.status).toBe(500)

      // The operation was not finalized, so the next attempt
      // reconciles it again and adopts the same organization.
      wrapper.setActive = "real"
      const retried = await rpc(
        ["organization", "create"],
        { name: "Acme" },
        actor.cookie,
      )
      expect(retried.status).toBe(200)
      expect((retried.body.json as { id: string }).id).toBe(orphan.id)

      // And the account holds one organization, not two.
      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.name, "Acme"))
      expect(rows).toHaveLength(1)
    })
  }
})

/**
 * Waits until an insert is waiting for the guard's lock.
 *
 * The wait is on the database's own view of the lock, not on a timer,
 * so the test is deterministic: the creation either reaches the guard
 * or the wait times out and says so.
 */
const waitForBlockedInsert = async (
  pool: ReturnType<typeof postgres>,
): Promise<void> => {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const rows = await pool`
      SELECT count(*)::int AS waiting
      FROM pg_stat_activity
      WHERE wait_event_type = 'Lock'
        AND query ILIKE '%insert into "organization"%'
    `
    if ((rows[0]?.waiting ?? 0) > 0) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error("The insert never waited for the guard's lock.")
}
