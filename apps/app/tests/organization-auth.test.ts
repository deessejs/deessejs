import { beforeEach, describe, expect, it, vi } from "vitest"
import { APIError } from "better-auth/api"

// `vi.mock` factories are hoisted above every import, so the shared
// spies and the sentinel thrown by the `redirect` stub have to be
// created inside `vi.hoisted` for the factories to close over them.
const h = vi.hoisted(() => {
  /** Stands in for the thrown control-flow error Next's `redirect` uses. */
  class RedirectSignal extends Error {
    constructor(readonly location: string) {
      super(`NEXT_REDIRECT:${location}`)
      this.name = "RedirectSignal"
    }
  }
  return {
    RedirectSignal,
    getSession: vi.fn(),
    fetchFullOrganization: vi.fn(),
    headers: vi.fn(),
    redirect: vi.fn((location: string) => {
      throw new RedirectSignal(location)
    }),
  }
})

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: h.headers }))
vi.mock("next/navigation", () => ({ redirect: h.redirect }))
vi.mock("@workspace/auth", () => ({
  auth: { api: { getSession: h.getSession } },
}))
vi.mock("@workspace/auth/organization/queries", () => ({
  fetchFullOrganization: h.fetchFullOrganization,
}))

const { requireOrganizationAccess } = await import("../lib/organization-auth")

const SLUG = "acme"
const USER_ID = "user-current"
const ORG_ID = "org-1"

type OrgRole = "owner" | "admin" | "member"
type OrgAccessAction =
  | "view"
  | "view-members"
  | "manage-invitations"
  | "manage-settings"
  | "delete-organization"

const ROLES: readonly OrgRole[] = ["owner", "admin", "member"]
const ACTIONS: readonly OrgAccessAction[] = [
  "view",
  "view-members",
  "manage-invitations",
  "manage-settings",
  "delete-organization",
]

/**
 * The expected outcome for every role and action, written out rather
 * than derived from the implementation's own rank table: a test that
 * recomputed the table would agree with any off-by-one edit to it.
 *
 * `view` and `view-members` are open to any member. The two manage
 * actions are admin-level. Deleting the organization is owner-only.
 */
const EXPECTED_ALLOWED: Record<OrgRole, Record<OrgAccessAction, boolean>> = {
  owner: {
    view: true,
    "view-members": true,
    "manage-invitations": true,
    "manage-settings": true,
    "delete-organization": true,
  },
  admin: {
    view: true,
    "view-members": true,
    "manage-invitations": true,
    "manage-settings": true,
    "delete-organization": false,
  },
  member: {
    view: true,
    "view-members": true,
    "manage-invitations": false,
    "manage-settings": false,
    "delete-organization": false,
  },
}

function organizationResponse(role: OrgRole | string) {
  return {
    id: ORG_ID,
    slug: SLUG,
    members: [{ userId: USER_ID, role }],
  }
}

function signIn() {
  h.getSession.mockResolvedValue({
    session: { id: "session-1", token: "token-1" },
    user: { id: USER_ID, email: "user@acme.test", emailVerified: true },
  })
}

async function accessAs(role: OrgRole | string, action: OrgAccessAction) {
  signIn()
  h.fetchFullOrganization.mockResolvedValue(organizationResponse(role))
  return captureAccess(() => requireOrganizationAccess(SLUG, action))
}

/**
 * `redirect` throws in Next, so a call that redirects rejects. Turn
 * that into a value the test can assert on, and let anything else
 * propagate.
 */
async function captureAccess(run: () => Promise<unknown>) {
  try {
    return { access: (await run()) as { role: string; slug: string } | undefined }
  } catch (error) {
    if (error instanceof h.RedirectSignal) return { redirect: error.location }
    throw error
  }
}

beforeEach(() => {
  h.headers.mockResolvedValue(new Headers())
  h.getSession.mockReset()
  h.fetchFullOrganization.mockReset()
})

describe("requireOrganizationAccess: session", () => {
  it("redirects to /login when there is no session", async () => {
    h.getSession.mockResolvedValue(null)

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: "/login" })
    // No organization lookup happens without a session: an anonymous
    // request must not be able to probe which slugs exist.
    expect(h.fetchFullOrganization).not.toHaveBeenCalled()
  })

  it("redirects to /login when the session envelope is incomplete", async () => {
    h.getSession.mockResolvedValue({ session: null, user: null })

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: "/login" })
  })
})

describe("requireOrganizationAccess: organization resolution", () => {
  it("redirects to /no-organization when the org does not exist", async () => {
    signIn()
    h.fetchFullOrganization.mockRejectedValue(
      new APIError("BAD_REQUEST", { code: "ORGANIZATION_NOT_FOUND" }),
    )

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: "/no-organization" })
  })

  it("redirects to /no-organization when the endpoint returns no organization", async () => {
    signIn()
    h.fetchFullOrganization.mockResolvedValue(null)

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: "/no-organization" })
  })

  it("redirects to the forbidden page when the user is not a member", async () => {
    signIn()
    h.fetchFullOrganization.mockRejectedValue(
      new APIError("FORBIDDEN", {
        code: "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION",
      }),
    )

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: `/${SLUG}/forbidden` })
  })

  it("rethrows an APIError carrying an unrelated code", async () => {
    signIn()
    const failure = new APIError("FORBIDDEN", { code: "SOMETHING_ELSE" })
    h.fetchFullOrganization.mockRejectedValue(failure)

    await expect(
      requireOrganizationAccess(SLUG, "view"),
    ).rejects.toBe(failure)
  })

  it("rethrows an error that is not an APIError", async () => {
    signIn()
    const failure = new Error("transport exploded")
    h.fetchFullOrganization.mockRejectedValue(failure)

    await expect(
      requireOrganizationAccess(SLUG, "view"),
    ).rejects.toBe(failure)
  })

  it("rethrows an APIError whose body carries no code", async () => {
    signIn()
    const failure = new APIError("BAD_REQUEST", { message: "nope" })
    h.fetchFullOrganization.mockRejectedValue(failure)

    await expect(
      requireOrganizationAccess(SLUG, "view"),
    ).rejects.toBe(failure)
  })

  it("redirects to the forbidden page when the response omits the membership", async () => {
    signIn()
    h.fetchFullOrganization.mockResolvedValue({
      id: ORG_ID,
      slug: SLUG,
      members: [{ userId: "someone-else", role: "owner" }],
    })

    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "view"),
    )

    expect(outcome).toEqual({ redirect: `/${SLUG}/forbidden` })
  })
})

describe("requireOrganizationAccess: role and action matrix", () => {
  for (const role of ROLES) {
    for (const action of ACTIONS) {
      const allowed = EXPECTED_ALLOWED[role][action]

      it(`${role} ${allowed ? "may" : "may not"} ${action}`, async () => {
        const outcome = await accessAs(role, action)

        if (allowed) {
          expect(outcome).toEqual({
            access: {
              userId: USER_ID,
              organizationId: ORG_ID,
              slug: SLUG,
              role,
            },
          })
        } else {
          expect(outcome).toEqual({ redirect: `/${SLUG}/forbidden` })
        }
      })
    }
  }
})

describe("requireOrganizationAccess: rank thresholds", () => {
  // The matrix above catches a typo in an action's required rank. These
  // two name the boundaries explicitly, so an off-by-one in the rank
  // table itself is reported as a threshold failure rather than as
  // fifteen unrelated matrix failures.
  it("member is on the correct side of the member/admin boundary", async () => {
    expect((await accessAs("member", "view-members")).access).toBeDefined()
    expect((await accessAs("member", "manage-invitations")).redirect).toBe(
      `/${SLUG}/forbidden`,
    )
  })

  it("admin is on the correct side of the admin/owner boundary", async () => {
    expect((await accessAs("admin", "manage-settings")).access).toBeDefined()
    expect((await accessAs("admin", "delete-organization")).redirect).toBe(
      `/${SLUG}/forbidden`,
    )
  })
})

describe("requireOrganizationAccess: unknown values", () => {
  it("redirects a user holding an unknown role to the forbidden page and logs it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const outcome = await accessAs("guest", "view")

    expect(outcome).toEqual({ redirect: `/${SLUG}/forbidden` })
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError.mock.calls[0]?.[0]).toBe("[organization-auth] unknown role")
  })

  it("redirects an unknown action to the misconfigured page and logs it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    signIn()
    const outcome = await captureAccess(() =>
      requireOrganizationAccess(SLUG, "manage-invitation"),
    )

    expect(outcome).toEqual({ redirect: "/error?reason=misconfigured" })
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError.mock.calls[0]?.[0]).toBe(
      "[organization-auth] unknown action",
    )
    // The action is validated before anything is read, so a typo in a
    // caller cannot turn into an outbound query.
    expect(h.getSession).not.toHaveBeenCalled()
    expect(h.fetchFullOrganization).not.toHaveBeenCalled()
  })
})