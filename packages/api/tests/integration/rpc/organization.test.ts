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
import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { inject } from "vitest"

import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import { member, organization, session, user } from "@workspace/database/schema"

import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

const SESSION_COOKIE_NAME = "better-auth.session_token"

let counter = 0

const uniqueId = (prefix: string): string =>
  `${prefix}-${randomUUID().slice(0, 8)}-${counter++}`

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
const createActor = async (activeOrganizationId?: string): Promise<Actor> => {
  const id = uniqueId("user")
  const email = `${id}@example.com`
  await db.insert(user).values({
    id,
    name: id,
    email,
    emailVerified: true,
  })
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
  return { id, slug }
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
