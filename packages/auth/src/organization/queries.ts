import { auth } from "../auth.js"

/**
 * Typed access to the organization plugin's server endpoints.
 *
 * ## Why this module exists
 *
 * `apps/app` must not import `@workspace/database`: the database
 * package is the storage layer, and the application reads state
 * through an API. For organization data that API is Better Auth's
 * own endpoint surface, reached with `auth.api.*`.
 *
 * Reaching those endpoints from application code needs a cast.
 * `packages/auth/src/auth.ts` annotates its config with
 * `BetterAuthOptions` and then casts the public `auth` export to
 * `ReturnType<typeof betterAuth<...>>`. The annotation is what
 * suppresses TS2883; its cost is that the inferred `$Infer` chain
 * no longer carries the plugin-augmented endpoint map, so
 * `getFullOrganization` is absent from the static type of
 * `auth.api`.
 *
 * That cast belongs here, next to the declaration that lost the
 * type, rather than at every call site: a consumer importing
 * `fetchFullOrganization` gets a real signature and no assertion.
 * This is the same reasoning as the `AuthSession` annotation on the
 * public `auth` export, which re-augments by hand what the
 * annotation dropped.
 *
 * ## Response shape
 *
 * `getFullOrganization` is Better Auth 1.7.7's
 * `/organization/get-full-organization` endpoint. It resolves the
 * organization from `organizationSlug` and returns it joined to its
 * members, invitations, and (when teams are enabled) its teams.
 * The fields declared below are the ones this package's consumers
 * read; the endpoint returns more, and callers that need the rest
 * should widen `FullOrganization` here rather than cast at the call
 * site.
 *
 * It throws rather than returning `null` when the organization does
 * not exist (`APIError("BAD_REQUEST", { code: "ORGANIZATION_NOT_FOUND"
 * })`) or when the caller is not a member (`APIError("FORBIDDEN", {
 * code: "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION" })`).
 */

/** One row of the organization's member list. `role` is a free-text column. */
export type OrganizationMember = {
  userId: string
  role: string
}

/** The subset of `getFullOrganization`'s response this package consumes. */
export type FullOrganization = {
  id: string
  slug: string
  members: OrganizationMember[]
}

type OrganizationApi = {
  getFullOrganization: (args: {
    headers: Headers
    query: { organizationSlug: string }
  }) => Promise<FullOrganization | null>
}

// The single place in the workspace where the lost plugin-endpoint
// type is re-asserted. See the module docstring for why it cannot be
// derived statically.
const organizationApi = auth.api as unknown as OrganizationApi

/**
 * Read an organization and its members through Better Auth's
 * `getFullOrganization` endpoint.
 *
 * The session is read from `headers`, so the caller forwards the
 * incoming request headers unchanged; Better Auth's
 * `orgSessionMiddleware` rejects an unauthenticated call.
 *
 * @throws {APIError} `ORGANIZATION_NOT_FOUND` when no organization
 * matches the slug, `USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` when
 * the session is valid but the user holds no membership.
 */
export function fetchFullOrganization(args: {
  headers: Headers
  query: { organizationSlug: string }
}): Promise<FullOrganization | null> {
  return organizationApi.getFullOrganization(args)
}