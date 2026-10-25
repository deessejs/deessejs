import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@workspace/database"
import { organization } from "@workspace/database/schema"
import {
  createOrganization as createOrganizationWithPlugin,
  setActiveOrganization,
} from "@workspace/auth/organization/create"
import type { CreatedOrganization } from "@workspace/auth/organization/create"
import {
  beginOperation,
  findMembership,
  findPendingOperationForUser,
  readOrganizationMarker,
  touchOperation,
  transitionOperation,
} from "@workspace/auth/organization/provisioning"
import type { ProvisioningOperation } from "@workspace/auth/organization/provisioning"
import { organizationSlugCandidates } from "@workspace/auth/organization/policy"
import { ORGANIZATION_PROVISIONING_STATUS } from "@workspace/database/schema"

/**
 * The provisioning of an organization.
 *
 * Creating an organization is not one call. The plugin writes the
 * organization, then its membership, then the caller's active
 * selection, and the process can fail or die between them. The flow
 * owns the operation row, the retry, the compensation and the
 * recovery, so a creation either leaves a complete organization
 * behind or leaves nothing at all.
 *
 * Two properties make it safe to retry, and both rest on the marker.
 * The marker travels in the organization's own metadata, written by
 * the insert itself, so an organization either carries its attempt's
 * marker or it does not belong to that attempt. The flow therefore
 * never deletes an organization it did not create: it deletes by the
 * id of the organization whose marker names its own operation, and
 * never by a slug alone.
 */

/** How long an operation may go without progress before it may be taken over. */
const PROVISIONING_LEASE_MS = 5 * 60 * 1000

/** The name of the constraint that holds the organization's slug. */
const SLUG_CONSTRAINT = "organization_slug_unique"

/** The name of the constraint that serializes the account. */
const PENDING_OPERATION_CONSTRAINT = "organization_provisioning_pending_user_uidx"

/** The SQLSTATE the database raises when the guard refuses an insert. */
const SUPERSEDED_SQLSTATE = "D0001"

/** The failures the flow reports, and the codes the procedure declares. */
export type ProvisioningFailureCode =
  | "ORGANIZATION_NAME_INVALID"
  | "ORGANIZATION_CREATE_IN_PROGRESS"
  | "ORGANIZATION_CREATE_FAILED"

/** A failure the flow reports, carrying the code the procedure declares. */
export class OrganizationProvisioningError extends Error {
  readonly code: ProvisioningFailureCode

  constructor(code: ProvisioningFailureCode, message: string) {
    super(message)
    this.name = "OrganizationProvisioningError"
    this.code = code
  }
}

/** Whether the value is a plain object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * The code a failure carries.
 *
 * The plugin reports its refusals in the body's code, and the driver
 * reports the database's in the error's own code. Both are read here,
 * so the flow tells a collision from a takeover from a real failure
 * without caring which layer refused.
 */
const codeOf = (error: unknown): string | null => {
  if (!isRecord(error)) return null
  if (typeof error.code === "string") return error.code
  if (isRecord(error.body) && typeof error.body.code === "string") {
    return error.body.code
  }
  return null
}

/** The constraint a unique violation names. */
const constraintOf = (error: unknown): string | null => {
  if (!isRecord(error)) return null
  return typeof error.constraint_name === "string" ? error.constraint_name : null
}

/** What a refused creation means. */
type CreateOutcome = "collision" | "superseded" | "failure"

/**
 * Reads a refusal.
 *
 * Only two refusals are a collision: the plugin's own, which happens
 * before anything is written, and the unique violation on the slug,
 * which is the insert itself failing. A takeover is not a collision:
 * the attempt was overtaken, and the next candidate would fail the
 * same way.
 */
const classify = (error: unknown): CreateOutcome => {
  const code = codeOf(error)
  if (code === SUPERSEDED_SQLSTATE) return "superseded"
  if (code === "provisioning_superseded") return "superseded"
  if (code === "ORGANIZATION_ALREADY_EXISTS") return "collision"
  if (
    code === "23505" &&
    constraintOf(error) === SLUG_CONSTRAINT
  ) {
    return "collision"
  }
  return "failure"
}

/** The organization that holds this slug, if there is one. */
const findOrganizationBySlug = async (
  slug: string,
): Promise<{ id: string; name: string; slug: string; createdAt: Date } | null> => {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Removes the organization this attempt created, if it created one.
 *
 * The proof is the marker: the organization is deleted only when its
 * own metadata names this operation. An organization that holds the
 * slug for another reason is left alone, and so is the account's
 * existing organization when the attempt never wrote anything.
 */
const compensate = async (
  operationId: string,
  slug: string,
): Promise<void> => {
  const org = await findOrganizationBySlug(slug)
  if (org === null) return
  const marker = await readOrganizationMarker(org.id)
  if (marker !== operationId) return
  await db.delete(organization).where(eq(organization.id, org.id))
}

/**
 * Reconciles an operation another attempt took over.
 *
 * The organization the operation was trying is looked up by its
 * slug, and its own marker decides what the attempt produced. The
 * operation has already been fenced out, so the attempt that lost
 * cannot create anything while its leftovers are inspected.
 *
 * The answer is the organization the attempt produced, when there is
 * one to adopt, and null when the flow has to start fresh.
 */
const reconcile = async (
  operation: ProvisioningOperation,
  headers: Headers,
): Promise<CreatedOrganization | null> => {
  const org = await findOrganizationBySlug(operation.slug)
  if (org === null) {
    await transitionOperation(
      operation.id,
      ORGANIZATION_PROVISIONING_STATUS.superseded,
      ORGANIZATION_PROVISIONING_STATUS.failed,
    )
    return null
  }

  const marker = await readOrganizationMarker(org.id)
  if (marker !== operation.id) {
    await transitionOperation(
      operation.id,
      ORGANIZATION_PROVISIONING_STATUS.superseded,
      ORGANIZATION_PROVISIONING_STATUS.failed,
    )
    return null
  }

  const membership = await findMembership(org.id, operation.userId)
  if (membership === null) {
    // The attempt died between the organization and its membership.
    // The organization is this attempt's, so it goes, and it goes by
    // its id.
    await db.delete(organization).where(eq(organization.id, org.id))
    await transitionOperation(
      operation.id,
      ORGANIZATION_PROVISIONING_STATUS.superseded,
      ORGANIZATION_PROVISIONING_STATUS.failed,
    )
    return null
  }

  // The attempt completed. The organization is adopted, and the
  // session of the request being answered is pointed at it, because
  // the attempt may have died before the plugin wrote the selection.
  await transitionOperation(
    operation.id,
    ORGANIZATION_PROVISIONING_STATUS.superseded,
    ORGANIZATION_PROVISIONING_STATUS.completed,
  )
  await setActiveOrganization({ organizationId: org.id, headers })
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    role: membership.role,
  }
}

/**
 * Takes over the account's pending operation, when there is one.
 *
 * A fresh operation means another attempt is running, and the flow
 * refuses. A stale one is fenced out and reconciled: adopted,
 * cleaned, or closed.
 */
const takeOver = async (
  userId: string,
  headers: Headers,
): Promise<CreatedOrganization | null> => {
  const pending = await findPendingOperationForUser(userId)
  if (pending === null) return null

  const age = Date.now() - pending.updatedAt.getTime()
  if (age < PROVISIONING_LEASE_MS) {
    throw new OrganizationProvisioningError(
      "ORGANIZATION_CREATE_IN_PROGRESS",
      "An organization is already being created for this account.",
    )
  }

  // The attempt is fenced out before anything is reconciled, so it
  // cannot create anything while its leftovers are inspected.
  const fenced = await transitionOperation(
    pending.id,
    ORGANIZATION_PROVISIONING_STATUS.pending,
    ORGANIZATION_PROVISIONING_STATUS.superseded,
  )
  if (!fenced) {
    throw new OrganizationProvisioningError(
      "ORGANIZATION_CREATE_IN_PROGRESS",
      "An organization is already being created for this account.",
    )
  }

  return reconcile(pending, headers)
}

/**
 * Creates an organization for an account, and leaves nothing behind
 * when it cannot.
 *
 * The flow is the owner of the operation row. It begins the
 * operation, tries the slug candidates, settles the operation, and
 * reconciles an interrupted one before it starts.
 */
export async function provisionOrganization(input: {
  userId: string
  name: string
  headers: Headers
}): Promise<CreatedOrganization> {
  const candidates = organizationSlugCandidates(input.name)
  const firstCandidate = candidates[0]
  if (firstCandidate === undefined) {
    throw new OrganizationProvisioningError(
      "ORGANIZATION_CREATE_FAILED",
      "The organization could not be created.",
    )
  }

  const adopted = await takeOver(input.userId, input.headers)
  if (adopted !== null) return adopted

  const operationId = randomUUID()
  try {
    await beginOperation({
      id: operationId,
      userId: input.userId,
      name: input.name,
      slug: firstCandidate,
    })
  } catch (error) {
    // The partial unique index refused the insert: another attempt
    // for the same account is running.
    if (codeOf(error) === "23505" && constraintOf(error) === PENDING_OPERATION_CONSTRAINT) {
      throw new OrganizationProvisioningError(
        "ORGANIZATION_CREATE_IN_PROGRESS",
        "An organization is already being created for this account.",
      )
    }
    throw error
  }

  for (const candidate of candidates) {
    await touchOperation(operationId, candidate)

    let created: CreatedOrganization
    try {
      created = await createOrganizationWithPlugin({
        name: input.name,
        slug: candidate,
        marker: operationId,
        headers: input.headers,
      })
    } catch (error) {
      const outcome = classify(error)

      if (outcome === "collision") {
        // Nothing was written: the plugin refuses an existing slug
        // before it creates anything, and a unique violation means the
        // insert itself failed. The next candidate is tried.
        continue
      }

      if (outcome === "superseded") {
        // The attempt was overtaken, not broken. The operation is no
        // longer pending, so there is nothing of ours to clean up.
        await transitionOperation(
          operationId,
          ORGANIZATION_PROVISIONING_STATUS.pending,
          ORGANIZATION_PROVISIONING_STATUS.superseded,
        )
        throw new OrganizationProvisioningError(
          "ORGANIZATION_CREATE_IN_PROGRESS",
          "An organization is already being created for this account.",
        )
      }

      await compensate(operationId, candidate)
      await transitionOperation(
        operationId,
        ORGANIZATION_PROVISIONING_STATUS.pending,
        ORGANIZATION_PROVISIONING_STATUS.failed,
      )
      throw new OrganizationProvisioningError(
        "ORGANIZATION_CREATE_FAILED",
        "The organization could not be created.",
      )
    }

    await transitionOperation(
      operationId,
      ORGANIZATION_PROVISIONING_STATUS.pending,
      ORGANIZATION_PROVISIONING_STATUS.completed,
    )
    return created
  }

  await transitionOperation(
    operationId,
    ORGANIZATION_PROVISIONING_STATUS.pending,
    ORGANIZATION_PROVISIONING_STATUS.failed,
  )
  throw new OrganizationProvisioningError(
    "ORGANIZATION_CREATE_FAILED",
    "The organization could not be created.",
  )
}
