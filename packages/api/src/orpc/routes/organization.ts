import { ORPCError } from "@orpc/server"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { MyOrganizationsListResponseV1 } from "@workspace/contracts/v1"
import {
  hasOrganizationProEntitlement,
  subscriptionGrantsPro,
} from "@workspace/auth/organization/entitlement"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  assertOrganizationName,
  slugifyOrganizationName,
} from "@workspace/auth/organization/policy"
import { db } from "@workspace/database"
import {
  invitation,
  member,
  organization,
  organizationProSeat,
  subscription,
  user,
} from "@workspace/database/schema"

import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"
import {
  findOrganizationForMember,
  findOrganizationForMemberById,
  findOrganizationsForMember,
} from "../../core/organization/membership.js"
import {
  OrganizationProvisioningError,
  provisionOrganization,
} from "../../core/organization/provisioning.js"

const organizationSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  role: z.string(),
})

/**
 * The one refusal this procedure produces.
 *
 * A membership read that returns no row is the only thing mapped to it.
 * Every other failure propagates: a database outage is a 500, not a
 * 403. There is no blanket catch here, and adding one would report
 * every infrastructure failure as a permission denial.
 *
 * The status and the message live in the procedure's error map, so the
 * two procedures that refuse cannot drift apart, and the refusal the
 * client sees is the declared one.
 */
const accessDeniedErrors = {
  ORGANIZATION_ACCESS_DENIED: {
    status: 403,
    message: "You cannot access this organization.",
  },
}

const invitationSummary = z.object({
  id: z.string(),
  email: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  inviterName: z.string(),
})

/** OAuth identity is supplied only by the verified MCP request boundary. */
const mcpOrganizationsGuard = base.middleware(async ({ context, next }) => {
  const identity = context.mcpIdentity
  if (!identity?.userId || !identity.scopes.includes("organizations:read")) {
    throw new ORPCError("FORBIDDEN")
  }
  return next({
    context: {
      ...context,
      mcpIdentity: { userId: identity.userId, scopes: identity.scopes },
    },
  })
})

/** Lists only the authenticated user's current memberships and roles. */
const listMine = base
  .use(mcpOrganizationsGuard)
  .output(MyOrganizationsListResponseV1)
  .handler(async ({ context }) => ({
    organizations: await findOrganizationsForMember(context.mcpIdentity.userId),
  }))

/**
 * Reads the organization the caller named, if they belong to it.
 *
 * The check lives here and not in the handler, so a procedure cannot
 * forget it and a caller cannot reach the data without it. The read
 * joins the membership row to the organization, so an unknown slug and
 * a known organization the caller does not belong to produce the same
 * empty result, and the refusal cannot be told apart from a refusal
 * that would have been produced by a name that does not exist.
 */
const resolveForCaller = async (
  options: { context: { user: { id: string } } },
  slug: string,
  accessDenied: () => ORPCError<"ORGANIZATION_ACCESS_DENIED", unknown>
) => {
  const org = await findOrganizationForMember(options.context.user.id, slug)
  if (!org) throw accessDenied()
  return org
}

/**
 * The organization's detail, for a member of it.
 *
 * Requires membership. A caller who does not belong to the organization
 * gets the same refusal as a caller who named a slug that does not
 * exist.
 */
export const bySlug = base
  .input(z.object({ slug: z.string() }))
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(organizationSummary)
  .handler(async ({ context }) => context.organization)

/**
 * The organization's settings, for a member who may administer it.
 *
 * Requires membership and a managing role, that is `owner` or `admin`.
 * The role is compared the way the plugin compares it: a member
 * stored as "admin,owner" holds both. A caller who is not a member and
 * a member whose role is below the threshold get the same refusal, so
 * the response never tells a non-member that the organization exists,
 * and never tells a low-role member that their role was the problem.
 */
export const settings = base
  .input(z.object({ slug: z.string() }))
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    if (!hasManagingRole(org.role)) {
      throw options.errors.ORGANIZATION_ACCESS_DENIED()
    }
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(organizationSummary)
  .handler(async ({ context }) => context.organization)

/** A sanitized entitlement read for any current organization member. */
export const proEntitlement = base
  .input(z.object({ slug: z.string() }))
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    return options.next({
      context: { ...options.context, organization: org },
    })
  })
  .output(z.object({ proIncluded: z.boolean() }))
  .handler(async ({ context }) => ({
    proIncluded: await hasOrganizationProEntitlement(
      context.user.id,
      context.organization.id
    ),
  }))

/** Seat allocations are visible to billing managers only. */
export const proSeatAssignments = base
  .input(z.object({ slug: z.string() }))
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    if (!hasManagingRole(org.role)) {
      throw options.errors.ORGANIZATION_ACCESS_DENIED()
    }
    return options.next({ context: { ...options.context, organization: org } })
  })
  .output(z.object({ memberIds: z.array(z.string()) }))
  .handler(async ({ context }) => {
    const rows = await db
      .select({ memberId: organizationProSeat.memberId })
      .from(organizationProSeat)
      .where(eq(organizationProSeat.organizationId, context.organization.id))
    return { memberIds: rows.map((row) => row.memberId) }
  })

/** Assign or release one purchased seat after rechecking role, membership, and capacity. */
export const setProSeatAssignment = base
  .input(
    z.object({ slug: z.string(), memberId: z.string(), assigned: z.boolean() })
  )
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    if (!hasManagingRole(org.role)) {
      throw options.errors.ORGANIZATION_ACCESS_DENIED()
    }
    return options.next({ context: { ...options.context, organization: org } })
  })
  .output(z.object({ assigned: z.boolean() }))
  .handler(async ({ context, input }) => {
    return db.transaction(async (tx) => {
      await tx
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, context.organization.id))
        .for("update")
      const [membership] = await tx
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.organizationId, context.organization.id),
            eq(member.id, input.memberId)
          )
        )
        .limit(1)
      if (!membership) throw new ORPCError("NOT_FOUND")

      const [activeSubscription] = await tx
        .select({
          plan: subscription.plan,
          status: subscription.status,
          billingInterval: subscription.billingInterval,
          endedAt: subscription.endedAt,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          periodEnd: subscription.periodEnd,
          seats: subscription.seats,
        })
        .from(subscription)
        .where(eq(subscription.referenceId, context.organization.id))
      if (!activeSubscription || !subscriptionGrantsPro(activeSubscription)) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "An active Pro subscription is required to assign seats.",
        })
      }

      const current = await tx
        .select({
          id: organizationProSeat.id,
          memberId: organizationProSeat.memberId,
        })
        .from(organizationProSeat)
        .where(eq(organizationProSeat.organizationId, context.organization.id))
      const alreadyAssigned = current.some(
        (seat) => seat.memberId === input.memberId
      )
      if (input.assigned && !alreadyAssigned) {
        if (current.length >= (activeSubscription.seats ?? 0)) {
          throw new ORPCError("PRECONDITION_FAILED", {
            message:
              "All purchased Pro seats are assigned. Add seat capacity in billing first.",
          })
        }
        await tx.insert(organizationProSeat).values({
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          memberId: input.memberId,
        })
      } else if (!input.assigned && alreadyAssigned) {
        await tx
          .delete(organizationProSeat)
          .where(
            and(
              eq(organizationProSeat.organizationId, context.organization.id),
              eq(organizationProSeat.memberId, input.memberId)
            )
          )
      }
      return { assigned: input.assigned }
    })
  })

/** Pending invitations are visible to owners and admins only. */
export const pendingInvitations = base
  .input(z.object({ slug: z.string() }))
  .errors(accessDeniedErrors)
  .use(authGuard)
  .use(async (options, input) => {
    const org = await resolveForCaller(
      options,
      input.slug,
      options.errors.ORGANIZATION_ACCESS_DENIED
    )
    if (!hasManagingRole(org.role)) {
      throw options.errors.ORGANIZATION_ACCESS_DENIED()
    }
    return options.next({
      context: { ...options.context, organization: org },
    })
  })

  .output(z.array(invitationSummary))
  .handler(async ({ context }) => {
    const rows = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        inviterName: user.name,
      })
      .from(invitation)
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(
        and(
          eq(invitation.organizationId, context.organization.id),
          eq(invitation.status, "pending")
        )
      )
      .orderBy(desc(invitation.createdAt))
      .limit(100)

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    }))
  })

/** Incoming invitations for a verified recipient, across organizations. */
export const accountInvitations = base
  .use(authGuard)
  .output(
    z.array(
      z.object({
        id: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
        role: z.string().nullable(),
        inviterName: z.string(),
        expiresAt: z.string(),
        expired: z.boolean(),
      })
    )
  )
  .handler(async ({ context }) => {
    if (context.user.emailVerified !== true) return []

    const rows = await db
      .select({
        id: invitation.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        role: invitation.role,
        inviterName: user.name,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(
        and(
          sql`lower(${invitation.email}) = lower(${context.user.email})`,
          eq(invitation.status, "pending")
        )
      )
      .orderBy(desc(invitation.createdAt))
      .limit(100)

    const now = new Date()
    return rows.map((row) => ({
      ...row,
      expiresAt: row.expiresAt.toISOString(),
      expired: row.expiresAt <= now,
    }))
  })

/**
 * The state of the caller's active organization.
 *
 * The three states are distinct because the caller needs to tell them
 * apart: there is no active organization, the active organization is
 * one the caller still belongs to, or the session points at an
 * organization the caller has left.
 *
 * The state is computed first and `next()` is called once. A middleware
 * that extends the context with a value of several shapes has to make a
 * single call, because the return type is inferred as the union of the
 * `next()` results and the union keeps only its first branch.
 */
type ActiveState =
  | { status: "none" }
  | { status: "stale" }
  | {
      status: "active"
      organization: { id: string; slug: string; name: string }
      role: string
    }

export const active = base
  .use(authGuard)
  .use(async (options) => {
    const activeOrganizationId =
      options.context.session.activeOrganizationId ?? null
    const org = activeOrganizationId
      ? await findOrganizationForMemberById(
          options.context.user.id,
          activeOrganizationId
        )
      : null

    const activeState: ActiveState = !activeOrganizationId
      ? { status: "none" }
      : !org
        ? { status: "stale" }
        : {
            status: "active",
            organization: { id: org.id, slug: org.slug, name: org.name },
            role: org.role,
          }

    return options.next({
      context: { ...options.context, activeState },
    })
  })
  .output(
    z.discriminatedUnion("status", [
      z.object({ status: z.literal("none") }),
      z.object({ status: z.literal("stale") }),
      z.object({
        status: z.literal("active"),
        organization: z.object({
          id: z.string(),
          slug: z.string(),
          name: z.string(),
        }),
        role: z.string(),
      }),
    ])
  )
  .handler(async ({ context }) => context.activeState)

/**
 * The refusals the creation produces.
 *
 * They are declared here, so the client reads a stable code instead
 * of the plugin's own errors, and so the status of each refusal is
 * the one the product means: a name the policy rejects is a bad
 * request, an account that has not verified its email is a refusal
 * to act, an attempt that is already running is a conflict, and
 * everything else is a failure of the server.
 */
const createErrors = {
  ORGANIZATION_NAME_INVALID: {
    status: 400,
    message: "That organization name cannot be used.",
  },
  ORGANIZATION_SLUG_INVALID: {
    status: 400,
    message: "That organization slug cannot be used.",
  },
  ORGANIZATION_EMAIL_VERIFICATION_REQUIRED: {
    status: 403,
    message: "Verify your email before creating an organization.",
  },
  ORGANIZATION_CREATE_IN_PROGRESS: {
    status: 409,
    message: "An organization is already being created for this account.",
  },
  ORGANIZATION_CREATE_FAILED: {
    status: 500,
    message: "The organization could not be created.",
  },
}

/**
 * Creates an organization for the caller.
 *
 * The caller gives a name and a proposed slug. The server validates
 * the slug and decides the stored value after collision handling. The
 * creation itself belongs to the
 * provisioning flow, which owns the operation row, the retry against
 * the database, the compensation and the recovery.
 *
 * The procedure's own job is the error contract. It refuses what it
 * can refuse, and it turns the flow's failures into the declared
 * ones.
 */
export const create = base
  .input(z.object({ name: z.string(), slug: z.string().optional() }))
  .errors(createErrors)
  .use(authGuard)
  .use(async (options, input) => {
    // An account that has not verified its email cannot create an
    // organization. The plugin refuses one too, but its refusal
    // carries no code of ours and would be reported as a server
    // failure, which is the wrong shape for a refusal.
    if (options.context.user.emailVerified !== true) {
      throw options.errors.ORGANIZATION_EMAIL_VERIFICATION_REQUIRED()
    }

    // The name has to be one the policy accepts. The policy's own
    // refusal is turned into the declared one, so the client reads
    // the same code whatever refused it.
    try {
      assertOrganizationName(input.name)
    } catch {
      throw options.errors.ORGANIZATION_NAME_INVALID()
    }

    let created
    try {
      created = await provisionOrganization({
        userId: options.context.user.id,
        name: input.name,
        slug: input.slug ?? slugifyOrganizationName(input.name),
        headers: options.context.headers,
      })
    } catch (error) {
      if (error instanceof OrganizationProvisioningError) {
        if (error.code === "ORGANIZATION_NAME_INVALID") {
          throw options.errors.ORGANIZATION_NAME_INVALID()
        }
        if (error.code === "ORGANIZATION_SLUG_INVALID") {
          throw options.errors.ORGANIZATION_SLUG_INVALID()
        }
        if (error.code === "ORGANIZATION_CREATE_IN_PROGRESS") {
          throw options.errors.ORGANIZATION_CREATE_IN_PROGRESS()
        }
        throw options.errors.ORGANIZATION_CREATE_FAILED()
      }
      throw error
    }

    return options.next({
      context: { ...options.context, organization: created },
    })
  })
  .output(organizationSummary)
  .handler(async ({ context }) => ({
    id: context.organization.id,
    slug: context.organization.slug,
    name: context.organization.name,
    logo: null,
    role: context.organization.role,
  }))

export const organizationRouter = {
  listMine,
  bySlug,
  settings,
  proEntitlement,
  proSeatAssignments,
  setProSeatAssignment,
  pendingInvitations,
  accountInvitations,
  active,
  create,
}
