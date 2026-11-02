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
import type { Context, Hono } from "hono"
import { VERSION, MIN_SUPPORTED_VERSION } from "../../constants/version.js"
import type { ApiEnv } from "../env.js"
import { rateLimit } from "../middleware/rate-limit.js"
import { mountGitHubAppSetup } from "./github-app.js"
import { cleanupAvatars } from "../../core/avatars/lifecycle.js"
import { getAvatarStorage } from "../../core/avatars/storage.js"
import { templatePublications, templates } from "@workspace/database/schema"
import { user } from "@workspace/database/schema"
import { cleanupTemplateImageUploads } from "../../core/templates/images.js"

async function resolveAvatarImageAccess(objectId: string, viewerId?: string) {
  if (!viewerId) return null
  const [personal] = await db
    .select({ userId: userAvatars.userId, objectKey: storageObjects.objectKey })
    .from(userAvatars)
    .innerJoin(storageObjects, eq(storageObjects.id, userAvatars.objectId))
    .where(
      and(eq(userAvatars.objectId, objectId), eq(storageObjects.state, "ready"))
    )
    .limit(1)
  if (personal?.userId === viewerId) return { objectKey: personal.objectKey }
  if (personal) {
    const owner = alias(member, "avatar_owner_membership")
    const [shared] = await db
      .select({ id: member.id })
      .from(member)
      .innerJoin(owner, eq(member.organizationId, owner.organizationId))
      .innerJoin(userAvatars, eq(userAvatars.userId, owner.userId))
      .where(
        and(eq(member.userId, viewerId), eq(userAvatars.objectId, objectId))
      )
      .limit(1)
    if (shared) return { objectKey: personal.objectKey }
  }
  const [organization] = await db
    .select({ objectKey: storageObjects.objectKey })
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
        eq(member.userId, viewerId)
      )
    )
    .limit(1)
  return organization ? { objectKey: organization.objectKey } : null
}

async function streamImage(
  c: Context<ApiEnv>,
  key: string,
  cacheControl: string
) {
  const image = await getAvatarStorage().getObject(key)
  if (!image.body) return c.notFound()
  c.header("Cache-Control", cacheControl)
  c.header("Content-Type", "image/webp")
  c.header("X-Content-Type-Options", "nosniff")
  if (image.contentLength !== undefined)
    c.header("Content-Length", String(image.contentLength))
  return c.body(Readable.toWeb(image.body))
}

async function resolveTemplateImageAccess(objectId: string, viewerId?: string) {
  const [official] = await db
    .select({ objectKey: storageObjects.objectKey })
    .from(templates)
    .innerJoin(storageObjects, eq(storageObjects.id, templates.imageObjectId))
    .where(
      and(
        eq(templates.imageObjectId, objectId),
        eq(templates.ownerType, "platform"),
        eq(storageObjects.state, "ready")
      )
    )
    .limit(1)
  if (official) return { objectKey: official.objectKey, isPublic: true }

  const [published] = await db
    .select({ objectKey: storageObjects.objectKey })
    .from(templatePublications)
    .innerJoin(
      storageObjects,
      eq(storageObjects.id, templatePublications.imageObjectId)
    )
    .where(
      and(
        eq(templatePublications.imageObjectId, objectId),
        eq(templatePublications.publicationState, "current"),
        eq(templatePublications.reviewStatus, "approved"),
        eq(storageObjects.state, "ready")
      )
    )
    .limit(1)
  if (published) return { objectKey: published.objectKey, isPublic: true }

  if (!viewerId) return null
  const [review] = await db
    .select({ objectKey: storageObjects.objectKey })
    .from(templatePublications)
    .innerJoin(
      storageObjects,
      eq(storageObjects.id, templatePublications.imageObjectId)
    )
    .innerJoin(user, eq(user.id, viewerId))
    .where(
      and(
        eq(templatePublications.imageObjectId, objectId),
        eq(templatePublications.reviewStatus, "pending"),
        eq(storageObjects.state, "ready"),
        eq(user.role, "admin")
      )
    )
    .limit(1)
  if (review) return { objectKey: review.objectKey, isPublic: false }

  const [working] = await db
    .select({ objectKey: storageObjects.objectKey })
    .from(templates)
    .innerJoin(storageObjects, eq(storageObjects.id, templates.imageObjectId))
    .innerJoin(member, eq(member.organizationId, templates.organizationId))
    .where(
      and(
        eq(templates.imageObjectId, objectId),
        eq(templates.ownerType, "organization"),
        eq(member.userId, viewerId),
        eq(storageObjects.state, "ready")
      )
    )
    .limit(1)
  return working ? { objectKey: working.objectKey, isPublic: false } : null
}

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
    if (!/^[0-9a-f-]{36}$/i.test(objectId)) {
      return c.notFound()
    }

    const avatar = await resolveAvatarImageAccess(objectId, viewer?.id)
    if (avatar) return streamImage(c, avatar.objectKey, "private, no-store")

    const templateImage = await resolveTemplateImageAccess(objectId, viewer?.id)
    if (!templateImage) return c.notFound()
    return streamImage(
      c,
      templateImage.objectKey,
      templateImage.isPublic
        ? "public, max-age=300, immutable"
        : "private, no-store"
    )
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
    const avatars = await cleanupAvatars()
    const templateImages = await cleanupTemplateImageUploads()
    return c.json({ ...avatars, templateImages })
  })

  // Better Auth — login, signup, session, etc.
  api.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))

  mountGitHubAppSetup(api)
}
