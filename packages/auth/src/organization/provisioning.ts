import { and, eq } from "drizzle-orm"
import { APIError } from "better-auth/api"
import { db } from "@workspace/database"
import {
  isOrganizationProvisioningStatus,
  member,
  organization,
  organizationProvisioning,
  ORGANIZATION_PROVISIONING_STATUS,
} from "@workspace/database/schema"
import type {
  OrganizationProvisioningRow,
  OrganizationProvisioningStatus,
} from "@workspace/database/schema"

import { assertOrganizationName, assertOrganizationSlug } from "./policy.js"

/**
 * The provisioning of an organization.
 *
 * Creating an organization is not one statement: the plugin writes
 * the organization, then its membership, then the caller's active
 * selection, and the process can die between them. This module owns
 * the record of the attempt, the marker that proves which attempt an
 * organization belongs to, and the two hooks that keep the marker
 * honest.
 *
 * The operation id is the marker. It travels in the organization's own
 * metadata, written by the insert itself, so an organization either
 * carries its attempt's marker or it does not belong to that attempt.
 * That is the proof the compensation and the reconciliation rest on,
 * and it survives a crash that leaves the operation row behind.
 *
 * The marker is written by the create hook and read by the update
 * hook, which refuses to let a caller change it. It is not the
 * product's to write.
 */

/** The metadata key the marker travels under. */
export const PROVISIONING_MARKER_KEY = "provisioningAttempt"

/** The operation, as the flow reads it. */
export type ProvisioningOperation = {
  id: string
  userId: string
  name: string
  slug: string
  status: OrganizationProvisioningStatus
  createdAt: Date
  updatedAt: Date
}

/** Whether the value is a plain object, which is what metadata is. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** The marker a metadata carries, or null when it carries none. */
export const readProvisioningMarker = (metadata: unknown): string | null => {
  if (!isRecord(metadata)) return null
  const marker = metadata[PROVISIONING_MARKER_KEY]
  return typeof marker === "string" && marker.length > 0 ? marker : null
}

/**
 * The marker a creation has to carry.
 *
 * The metadata is the application's, and the only thing it accepts
 * is a marker. A caller that reaches the plugin with a metadata of
 * its own is refused.
 */
export const assertProvisioningMarker = (metadata: unknown): string => {
  const marker = readProvisioningMarker(metadata)
  if (marker === null) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_metadata",
      message: "Organization metadata is not editable",
    })
  }
  return marker
}

/** Parses the metadata column, which holds a JSON string. */
const parseStoredMetadata = (raw: string | null): unknown => {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** The operation row, as the flow reads it. */
const toOperation = (row: OrganizationProvisioningRow): ProvisioningOperation => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  slug: row.slug,
  status: isOrganizationProvisioningStatus(row.status) ? row.status : "failed",
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

/** The operation with this id, whatever its state. */
export const findOperationById = async (
  id: string,
): Promise<ProvisioningOperation | null> => {
  const rows = await db
    .select()
    .from(organizationProvisioning)
    .where(eq(organizationProvisioning.id, id))
    .limit(1)
  return rows[0] ? toOperation(rows[0]) : null
}

/** The account's pending operation, if it has one. */
export const findPendingOperationForUser = async (
  userId: string,
): Promise<ProvisioningOperation | null> => {
  const rows = await db
    .select()
    .from(organizationProvisioning)
    .where(
      and(
        eq(organizationProvisioning.userId, userId),
        eq(
          organizationProvisioning.status,
          ORGANIZATION_PROVISIONING_STATUS.pending,
        ),
      ),
    )
    .limit(1)
  return rows[0] ? toOperation(rows[0]) : null
}

/**
 * The operation the create hook checks.
 *
 * Every condition is part of the check: the operation has to be this
 * account's, it has to be pending, and it has to be trying this slug.
 * A creation that carries any other operation's marker finds nothing
 * here and is refused.
 */
export const findPendingOperation = async (input: {
  id: string
  userId: string
  slug: string
}): Promise<ProvisioningOperation | null> => {
  const rows = await db
    .select()
    .from(organizationProvisioning)
    .where(
      and(
        eq(organizationProvisioning.id, input.id),
        eq(organizationProvisioning.userId, input.userId),
        eq(
          organizationProvisioning.status,
          ORGANIZATION_PROVISIONING_STATUS.pending,
        ),
        eq(organizationProvisioning.slug, input.slug),
      ),
    )
    .limit(1)
  return rows[0] ? toOperation(rows[0]) : null
}

/**
 * Records a new operation.
 *
 * The insert is what serializes the account: the partial unique
 * index refuses a second pending operation for the same account, so
 * the caller learns that another attempt is running.
 */
export const beginOperation = async (input: {
  id: string
  userId: string
  name: string
  slug: string
}): Promise<ProvisioningOperation> => {
  const now = new Date()
  const rows = await db
    .insert(organizationProvisioning)
    .values({
      id: input.id,
      userId: input.userId,
      name: input.name,
      slug: input.slug,
      status: ORGANIZATION_PROVISIONING_STATUS.pending,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  const row = rows[0]
  if (!row) {
    throw new Error("The provisioning operation could not be recorded.")
  }
  return toOperation(row)
}

/**
 * Refreshes the operation's heartbeat and records the candidate it
 * is trying.
 *
 * The write is conditional on the operation still being pending, so a
 * superseded attempt cannot revive itself.
 */
export const touchOperation = async (
  id: string,
  slug: string,
): Promise<void> => {
  await db
    .update(organizationProvisioning)
    .set({ slug, updatedAt: new Date() })
    .where(
      and(
        eq(organizationProvisioning.id, id),
        eq(
          organizationProvisioning.status,
          ORGANIZATION_PROVISIONING_STATUS.pending,
        ),
      ),
    )
}

/**
 * Moves the operation from one state to another.
 *
 * The write is conditional on the state it is leaving, which is what
 * makes it a fence: two attempts cannot both decide what happened to
 * the same operation. The answer says whether the transition applied.
 */
export const transitionOperation = async (
  id: string,
  from: OrganizationProvisioningStatus,
  to: OrganizationProvisioningStatus,
): Promise<boolean> => {
  const rows = await db
    .update(organizationProvisioning)
    .set({ status: to, updatedAt: new Date() })
    .where(
      and(
        eq(organizationProvisioning.id, id),
        eq(organizationProvisioning.status, from),
      ),
    )
    .returning({ id: organizationProvisioning.id })
  return rows.length > 0
}

/** The marker the organization carries, read from its own row. */
export const readOrganizationMarker = async (
  organizationId: string,
): Promise<string | null> => {
  const rows = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)
  const raw = rows[0]?.metadata ?? null
  return readProvisioningMarker(parseStoredMetadata(raw))
}

/**
 * The rules a creation has to satisfy, before anything is written.
 *
 * The name and the slug have to be acceptable, and the account has to
 * be verified. The function is pure: it reads nothing and writes
 * nothing, so the rules can be exercised on their own.
 */
export function assertCreatableOrganization(
  input: { name?: string; slug?: string; metadata?: unknown },
  user: { emailVerified?: boolean },
): asserts input is { name: string; slug: string; metadata?: unknown } {
  if (typeof input.name !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid organization name",
    })
  }
  if (typeof input.slug !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid organization slug",
    })
  }
  assertOrganizationName(input.name)
  assertOrganizationSlug(input.slug)
  if (user.emailVerified !== true) {
    throw new APIError("FORBIDDEN", {
      message: "Email verification is required",
    })
  }
}

/**
 * The `beforeCreateOrganization` hook.
 *
 * The hook decides what is stored. It validates the creation, reads
 * the marker out of the caller's metadata, checks the marker against
 * the pending operation, and returns the metadata the organization
 * will carry.
 *
 * The check it makes is a courtesy, not the guarantee: Better Auth
 * inserts the organization after this hook returns, so a takeover can
 * land in between. The guard that runs inside the insert is the
 * guarantee.
 */
export const beforeCreateOrganizationWithMarker = async ({
  organization: input,
  user,
}: {
  organization: { name?: string; slug?: string; metadata?: unknown }
  user: { id?: string; emailVerified?: boolean }
}) => {
  assertCreatableOrganization(input, user)

  const marker = assertProvisioningMarker(input.metadata)

  if (typeof user.id !== "string") {
    throw new APIError("UNAUTHORIZED", {
      message: "User not found",
    })
  }

  // The fence's early refusal. The operation has to be this
  // account's, it has to be pending, and it has to be trying this
  // slug. An attempt that is already stale costs nothing this way.
  const operation = await findPendingOperation({
    id: marker,
    userId: user.id,
    slug: input.slug,
  })
  if (operation === null) {
    throw new APIError("CONFLICT", {
      code: "provisioning_superseded",
      message: "This creation is no longer the current one",
    })
  }

  return {
    data: {
      name: input.name,
      metadata: { [PROVISIONING_MARKER_KEY]: marker },
    },
  }
}

/**
 * The `beforeUpdateOrganization` hook.
 *
 * The update endpoint accepts a metadata, and the marker is the proof
 * the compensation and the reconciliation rest on. A caller that may
 * update an organization must not be able to take the marker away,
 * and must not be able to put one there either.
 *
 * The hook reads the organization's stored metadata, because what it
 * receives is the update's payload and not the stored row.
 */
export const beforeUpdateOrganizationProtectingMarker = async ({
  organization: input,
  member: membership,
}: {
  organization: { metadata?: unknown }
  member: { organizationId: string }
  user: { id: string }
}) => {
  // An update that carries no metadata cannot change the marker.
  if (input.metadata === undefined) return

  const storedMarker = await readOrganizationMarker(membership.organizationId)
  const payloadMarker = readProvisioningMarker(input.metadata)

  if (storedMarker === null) {
    // The organization carries no marker, so there is none to protect.
    // A marker the caller brings is still refused: the marker is the
    // application's, and a forged one would make the reconciliation
    // believe an organization belongs to an attempt that never made it.
    if (payloadMarker !== null) {
      throw new APIError("FORBIDDEN", {
        code: "provisioning_marker_protected",
        message: "Organization metadata is not editable",
      })
    }
    return
  }

  const operation = await findOperationById(storedMarker)
  const finished = operation !== null && operation.status === "completed"

  if (!finished) {
    // The operation is still in flight. The marker is the proof that
    // this organization belongs to that attempt, and it is not the
    // caller's to change.
    throw new APIError("FORBIDDEN", {
      code: "provisioning_marker_protected",
      message: "Organization metadata is not editable",
    })
  }

  // The operation is finished, so the marker has served its purpose.
  // The update drops it, so a creation that died between the
  // operation and the marker converges instead of leaving the
  // organization's metadata locked forever.
  const rest: Record<string, unknown> = {}
  if (isRecord(input.metadata)) {
    for (const [key, value] of Object.entries(input.metadata)) {
      if (key === PROVISIONING_MARKER_KEY) continue
      rest[key] = value
    }
  }
  return { data: { metadata: rest } }
}

/** The membership the account holds in the organization. */
export const findMembership = async (
  organizationId: string,
  userId: string,
): Promise<{ role: string } | null> => {
  const rows = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, userId),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}
