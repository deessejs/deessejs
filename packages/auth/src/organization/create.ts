import { auth } from "../auth.js"
import { PROVISIONING_MARKER_KEY } from "./provisioning.js"

/**
 * The typed calls to the organization plugin.
 *
 * The plugin owns organization creation, and this application does not
 * reimplement it. What this module owns is the typed call: the
 * plugin's endpoints are absent from the type of `auth.api`, and the
 * assertion that reaches them lives here, in one place, next to the
 * code that needs it.
 *
 * The headers are not optional. The plugin resolves the creator from
 * the session, and a call without them creates an organization for
 * nobody.
 *
 * The marker is the operation's id, and it travels in the metadata:
 * the plugin's hook reads it, checks it against the pending
 * operation, and stores it with the insert.
 */

/** The organization the plugin created, as this application declares it. */
export type CreatedOrganization = {
  id: string
  name: string
  slug: string
  createdAt: Date
  /** The creator's role in the organization it was created with. */
  role: string
}

/**
 * The plugin's endpoints, as this module calls them.
 *
 * The shape is deliberately narrower than what the endpoints really
 * accept, and narrower than what they answer: the identity of the
 * organization and the creator's role are what the application needs,
 * and nothing else.
 */
type OrganizationPluginApi = {
  createOrganization: (input: {
    body: {
      name: string
      slug: string
      metadata?: Record<string, unknown>
    }
    headers: Headers
  }) => Promise<unknown>
  setActiveOrganization: (input: {
    body: { organizationId: string }
    headers: Headers
  }) => Promise<unknown>
}

// The plugin's endpoints are not on the type of `auth.api`, because the
// configuration is annotated with the bare `BetterAuthOptions` and the
// plugin augmentation is lost with it. This is the one assertion the
// module exists to hold, and the answers are checked against the
// declared shape below, so an upgrade that changes an endpoint's shape
// fails here rather than producing a lie.
const pluginApi = auth.api as unknown as OrganizationPluginApi

/** Whether the value is a plain object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** The date an answer carries, whichever form it arrives in. */
const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value
  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  throw new Error(
    "The organization creation answer carried no usable creation date.",
  )
}

/**
 * The organization the plugin's create endpoint answered.
 *
 * The endpoint answers the organization and its first member, and the
 * creator's role is on that member. The mapping is the wrapper's job,
 * because the role is not on the organization: the procedure that
 * consumes this declares `role` at the root, and it must not receive
 * an undefined one.
 */
const toCreatedOrganization = (answer: unknown): CreatedOrganization => {
  if (!isRecord(answer)) {
    throw new Error("The organization creation answer was not an object.")
  }
  const { id, name, slug, createdAt, members } = answer
  if (typeof id !== "string" || typeof name !== "string" || typeof slug !== "string") {
    throw new Error(
      "The organization creation answer carried no usable identity.",
    )
  }
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error(
      "The organization creation answer carried no membership for the creator.",
    )
  }
  const first = members[0]
  if (!isRecord(first) || typeof first.role !== "string") {
    throw new Error(
      "The organization creation answer carried no role for the creator.",
    )
  }
  return { id, name, slug, createdAt: toDate(createdAt), role: first.role }
}

/**
 * Creates an organization through the plugin.
 *
 * The slug is the caller's, and it is the server's: the flow that
 * calls this generated it. The marker is the operation's id, and it
 * travels in the metadata, so the organization carries the proof of
 * which attempt made it in the same statement that creates it.
 */
export async function createOrganization(input: {
  name: string
  slug: string
  marker: string
  headers: Headers
}): Promise<CreatedOrganization> {
  const answer = await pluginApi.createOrganization({
    body: {
      name: input.name,
      slug: input.slug,
      metadata: { [PROVISIONING_MARKER_KEY]: input.marker },
    },
    headers: input.headers,
  })
  return toCreatedOrganization(answer)
}

/**
 * Makes an organization the caller's active one.
 *
 * The recovery adopts an organization whose creation was interrupted
 * before the plugin could write the active selection, and the session
 * of the request being answered has to point at it.
 */
export async function setActiveOrganization(input: {
  organizationId: string
  headers: Headers
}): Promise<void> {
  await pluginApi.setActiveOrganization({
    body: { organizationId: input.organizationId },
    headers: input.headers,
  })
}
