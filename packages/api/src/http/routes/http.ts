import { sql } from "drizzle-orm"
import { and, eq } from "drizzle-orm"
import { timingSafeEqual } from "node:crypto"
import { Readable } from "node:stream"
import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import {
  member,
  organizationAvatars,
  storageObjects,
  userAvatars,
} from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"
import { alias } from "drizzle-orm/pg-core"
import projectSchema from "@workspace/registry/schema/project/v1.json"
import type { Hono } from "hono"
import { VERSION, MIN_SUPPORTED_VERSION } from "../../constants/version.js"
import type { ApiEnv } from "../env.js"
import { rateLimit } from "../middleware/rate-limit.js"
import { mountGitHubAppSetup } from "./github-app.js"
import { cleanupAvatars } from "../../core/avatars/lifecycle.js"
import { getAvatarStorage } from "../../core/avatars/storage.js"

/**
 * Direct HTTP routes that do not go through oRPC:
 *   - `GET /health`    — liveness probe, no dependencies.
 *   - `GET /version`   — server version probe. Cached aggressively.
 *   - `GET /ready`     — readiness probe, pings Postgres.
 *   - `*  /auth/*`     — Better Auth handler (login, signup, ...).
 *   - `GET /github-app/*`: GitHub App OAuth and installation callbacks.
 *
 * The oRPC router handles everything under `/rpc/*`. Adding a new
 * direct HTTP route is a deliberate choice (a non-RPC endpoint);
 * most things belong in `routes/templates.ts` and friends.
 */
export const mountHttp = (api: Hono<ApiEnv>): void => {
  // Liveness — cheap, always 200 unless the process is dead.
  api.get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString() })
  )

  // Public project configuration schema. The app domain rewrites the
  // canonical root URL to this API route.
  api.get("/schema/project/v1.json", (c) => {
    c.header(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    )
    return c.json(projectSchema)
  })

  // Server version probe — public, no auth, rate-limited. Cached
  // for 10 minutes because the values change only at release time.
  api.get("/version", rateLimit(serverEnv.RATE_LIMIT_PER_MINUTE), (c) => {
    c.header(
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=86400"
    )
    return c.json({
      version: VERSION,
      minSupported: MIN_SUPPORTED_VERSION,
    })
  })

  // Readiness — pings Postgres. db.execute throws on connection
  // failure (ECONNREFUSED, ETIMEDOUT, pool exhaustion); the catch
  // returns 503, the signal Kubernetes/LBs need to stop routing.
  api.get("/ready", async (c) => {
    try {
      await db.execute(sql`SELECT 1`)
      return c.json({ status: "ready" })
    } catch {
      return c.json({ status: "not ready" }, 503)
    }
  })

  api.get("/images/:objectId", async (c) => {
    const viewer = c.get("user")
    const objectId = c.req.param("objectId")
    if (!viewer || !/^[0-9a-f-]{36}$/i.test(objectId)) {
      return c.notFound()
    }

    const [personal] = await db
      .select({
        userId: userAvatars.userId,
        objectKey: storageObjects.objectKey,
      })
      .from(userAvatars)
      .innerJoin(storageObjects, eq(storageObjects.id, userAvatars.objectId))
      .where(
        and(
          eq(userAvatars.objectId, objectId),
          eq(storageObjects.state, "ready")
        )
      )
      .limit(1)
    let allowed = personal?.userId === viewer.id

    if (!allowed && personal) {
      const ownerMembership = alias(member, "avatar_owner_membership")
      const sharedOrganization = await db
        .select({ id: member.id })
        .from(member)
        .innerJoin(
          ownerMembership,
          eq(member.organizationId, ownerMembership.organizationId)
        )
        .innerJoin(userAvatars, eq(userAvatars.userId, ownerMembership.userId))
        .where(
          and(eq(member.userId, viewer.id), eq(userAvatars.objectId, objectId))
        )
        .limit(1)
      allowed = sharedOrganization.length > 0
    }

    const [organizationAvatar] = personal
      ? []
      : await db
          .select({
            organizationId: organizationAvatars.organizationId,
            objectKey: storageObjects.objectKey,
          })
          .from(organizationAvatars)
          .innerJoin(
            storageObjects,
            eq(storageObjects.id, organizationAvatars.objectId)
          )
          .innerJoin(
            member,
            eq(member.organizationId, organizationAvatars.organizationId)
          )
          .where(
            and(
              eq(organizationAvatars.objectId, objectId),
              eq(storageObjects.state, "ready"),
              eq(member.userId, viewer.id)
            )
          )
          .limit(1)

    if (!allowed && !organizationAvatar) return c.notFound()
    const objectKey = personal?.objectKey ?? organizationAvatar?.objectKey
    if (!objectKey) return c.notFound()

    const object = await getAvatarStorage().getObject(objectKey)
    if (!object.body) return c.notFound()
    c.header("Cache-Control", "private, no-store")
    c.header("Content-Type", "image/webp")
    c.header("X-Content-Type-Options", "nosniff")
    if (object.contentLength !== undefined) {
      c.header("Content-Length", String(object.contentLength))
    }
    return c.body(Readable.toWeb(object.body))
  })

  api.get("/internal/avatars/cleanup", async (c) => {
    const secret = serverEnv.CRON_SECRET
    if (!secret) return c.json({ error: "Cleanup is not configured." }, 503)
    const authorization = c.req.header("authorization") ?? ""
    const provided = Buffer.from(authorization.replace(/^Bearer\s+/i, ""))
    const expected = Buffer.from(secret)
    if (
      !/^Bearer\s+/i.test(authorization) ||
      provided.byteLength !== expected.byteLength ||
      !timingSafeEqual(provided, expected)
    ) {
      return c.json({ error: "Unauthorized." }, 401)
    }
    return c.json(await cleanupAvatars())
  })

  // Better Auth — login, signup, session, etc.
  api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))

  mountGitHubAppSetup(api)
}
