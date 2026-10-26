import { createHmac, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"
import { eq, inArray } from "drizzle-orm"

import { auth } from "../../src/auth.js"
import { createOrganization } from "../../src/organization/create.js"
import { db } from "@workspace/database"
import {
  organization,
  organizationProvisioning,
  session,
  user,
} from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"

/**
 * The wrapper, against the real endpoint.
 *
 * The plugin's endpoints are absent from the type of `auth.api`, and
 * the assertion that reaches them lives in the wrapper. A test that
 * calls the real endpoint and holds the answer against the declared
 * shape is what makes that assertion honest: an upgrade that changes
 * the endpoint's shape fails here, rather than producing a lie behind
 * the cast.
 *
 * The test needs a reachable Postgres: the plugin writes the
 * organization and its membership. It is skipped loudly when there is
 * none, so a misconfigured CI is visible.
 */
const HAS_DATABASE = !!serverEnv.TEST_DATABASE_URL || !!serverEnv.DATABASE_URL

const SESSION_COOKIE_NAME = "better-auth.session_token"

let counter = 0

const uniqueId = (prefix: string): string =>
  `${prefix}-${randomUUID().slice(0, 8)}-${counter++}`

const createdUsers: string[] = []
const createdOrganizations: string[] = []

afterEach(async () => {
  const users = createdUsers.splice(0)
  const organizations = createdOrganizations.splice(0)
  if (users.length > 0) {
    await db.delete(user).where(inArray(user.id, users))
  }
  if (organizations.length > 0) {
    await db.delete(organization).where(inArray(organization.id, organizations))
  }
})

/** The secret the server signs its cookies with. */
const authSecret = async (): Promise<string> => {
  const context = await auth.$context
  return context.options.secret
}

/** The session cookie, signed the way Better Auth signs it. */
const sessionCookie = async (token: string): Promise<string> => {
  const signature = createHmac("sha256", await authSecret())
    .update(token)
    .digest("base64")
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(`${token}.${signature}`)}`
}

/** A verified account, with a session and a pending operation. */
const createActor = async (
  slug: string,
): Promise<{ id: string; cookie: string; marker: string }> => {
  const id = uniqueId("user")
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: true,
  })
  createdUsers.push(id)

  const token = uniqueId("token")
  await db.insert(session).values({
    id: uniqueId("session"),
    token,
    userId: id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })

  const operationId = uniqueId("op")
  await db.insert(organizationProvisioning).values({
    id: operationId,
    userId: id,
    name: "Acme",
    slug,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return { id, cookie: await sessionCookie(token), marker: operationId }
}

describe.skipIf(!HAS_DATABASE)("createOrganization", () => {
  it("answers the organization and the creator's role", async () => {
    const slug = uniqueId("acme")
    const actor = await createActor(slug)

    const created = await createOrganization({
      name: "Acme",
      slug,
      marker: actor.marker,
      headers: new Headers({ cookie: actor.cookie }),
    })

    expect(created.name).toBe("Acme")
    expect(created.slug).toBe(slug)
    expect(created.id).toEqual(expect.any(String))
    expect(created.createdAt).toBeInstanceOf(Date)
    // The role is on the membership the endpoint answers, and the
    // wrapper maps it. It is never undefined.
    expect(created.role).toBe("owner")

    const rows = await db
      .select({ id: organization.id, metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, created.id))
    createdOrganizations.push(created.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.metadata).toContain("provisioningAttempt")
  })

  it("refuses a creation whose marker names no pending operation", async () => {
    const slug = uniqueId("acme")
    const actor = await createActor(slug)

    await expect(
      createOrganization({
        name: "Acme",
        slug,
        marker: uniqueId("op"),
        headers: new Headers({ cookie: actor.cookie }),
      }),
    ).rejects.toThrow()

    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
    expect(rows).toHaveLength(0)
  })

  it("refuses a creation with no session", async () => {
    const slug = uniqueId("acme")
    await createActor(slug)

    await expect(
      createOrganization({
        name: "Acme",
        slug,
        marker: uniqueId("op"),
        headers: new Headers(),
      }),
    ).rejects.toThrow()
  })
})
