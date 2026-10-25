import type { ORPCError } from "@orpc/server"
import { z } from "zod"
import { hasManagingRole } from "@workspace/auth/organization/roles"

import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"
import {
  findOrganizationForMember,
  findOrganizationForMemberById,
} from "../../core/organization/membership.js"

const organizationSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
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
  accessDenied: () => ORPCError<"ORGANIZATION_ACCESS_DENIED", unknown>,
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
      options.errors.ORGANIZATION_ACCESS_DENIED,
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
      options.errors.ORGANIZATION_ACCESS_DENIED,
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
          activeOrganizationId,
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
    ]),
  )
  .handler(async ({ context }) => context.activeState)

export const organizationRouter = {
  bySlug,
  settings,
  active,
}
