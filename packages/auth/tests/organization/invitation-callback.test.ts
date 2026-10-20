import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

// `vi.mock` is hoisted above this import. The factory is shared with
// the test body via `vi.hoisted` so the same `vi.fn()` reference is
// available to both the hoisted mock factory and the assertions.
//
// The mocked boundary is `sendOrganizationInvitationEmail`, not
// `sendAuthEmail`: the message is composed in `@workspace/email`, so
// this package's contract is what it hands over, and that is what the
// tests hold still.
const sendOrganizationInvitationEmail = vi.hoisted(() => {
  let resolveDispatch!: (value: { ok: true } | { ok: false; error: string }) => void
  let rejectDispatch!: (e: unknown) => void
  const dispatchPromise = new Promise<{ ok: true }>((res, rej) => {
    resolveDispatch = res
    rejectDispatch = rej
  })
  const fn = vi.fn(() => dispatchPromise)
  return { fn, dispatchPromise, resolveDispatch, rejectDispatch }
})

vi.mock("@workspace/email", () => ({
  sendOrganizationInvitationEmail: sendOrganizationInvitationEmail.fn,
}))

// Imports below run after vi.mock is hoisted.
const { dispatchInvitationEmail, sendInvitationEmail, InvitationError } =
  await import("../../src/organization/invitation.js")

const buildData = () => ({
  id: "inv-1",
  role: "member" as const,
  email: "invitee@example.com",
  organization: { id: "org-1", name: "Acme" },
  invitation: {
    expiresAt: new Date("2030-01-01T00:00:00Z"),
    email: "invitee@example.com",
  },
  inviter: { user: { id: "user-1", name: "Ada" } },
})

/** Drain the microtask queue so pending continuations run. */
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe("dispatchInvitationEmail", () => {
  beforeEach(() => {
    sendOrganizationInvitationEmail.fn.mockReset()
    sendOrganizationInvitationEmail.fn.mockImplementation(
      () => sendOrganizationInvitationEmail.dispatchPromise,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("throws InvitationError config_invalid on empty id", async () => {
    await expect(
      dispatchInvitationEmail({ ...buildData(), id: "" }),
    ).rejects.toBeInstanceOf(InvitationError)
    expect(sendOrganizationInvitationEmail.fn).not.toHaveBeenCalled()
  })

  it("resolves when the transport accepts the message", async () => {
    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({ ok: true })
    await expect(dispatchInvitationEmail(buildData())).resolves.toBeUndefined()
    expect(sendOrganizationInvitationEmail.fn).toHaveBeenCalledTimes(1)
  })

  it("hands the email package the link built from APP_URL", async () => {
    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({ ok: true })
    await dispatchInvitationEmail({ ...buildData(), id: "inv/42" })

    expect(sendOrganizationInvitationEmail.fn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "invitee@example.com",
        // The id is percent-encoded, so an id carrying a slash cannot
        // reshape the path.
        url: expect.stringContaining("/accept-invitation/inv%2F42"),
        organizationName: "Acme",
        inviterName: "Ada",
      }),
    )
  })

  it("falls back to a display name when the inviter has none", async () => {
    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({ ok: true })
    await dispatchInvitationEmail({
      ...buildData(),
      inviter: { user: { id: "user-1", name: null } },
    } as unknown as Parameters<typeof dispatchInvitationEmail>[0])

    expect(sendOrganizationInvitationEmail.fn).toHaveBeenCalledWith(
      expect.objectContaining({ inviterName: "Someone" }),
    )
  })

  it("throws InvitationError smtp_failed when the transport reports failure", async () => {
    // The path a real outage takes. `sendAuthEmail` never rejects, so a
    // transport failure arrives as `{ ok: false }` and has to be turned
    // into a typed error here, otherwise it would go unlogged.
    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({
      ok: false,
      error: "smtp_unavailable",
    })

    await expect(dispatchInvitationEmail(buildData())).rejects.toMatchObject({
      kind: "smtp_failed",
      message: "smtp_unavailable",
    })
  })

  it("rejects untyped when the composition layer itself throws", async () => {
    // Anything that is not an `InvitationError` is filed under
    // `dispatch_rejected` by the callback, so this must not be
    // mislabelled as a transport failure.
    sendOrganizationInvitationEmail.fn.mockRejectedValueOnce(
      new TypeError("composition exploded"),
    )

    let caught: unknown
    try {
      await dispatchInvitationEmail(buildData())
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(TypeError)
    expect(caught).not.toBeInstanceOf(InvitationError)
  })

  it("does not log on its own; the callback is the single logging point", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({ ok: true })
    await dispatchInvitationEmail(buildData())

    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({
      ok: false,
      error: "x",
    })
    await expect(dispatchInvitationEmail(buildData())).rejects.toBeInstanceOf(
      InvitationError,
    )

    sendOrganizationInvitationEmail.fn.mockRejectedValueOnce(new Error("y"))
    await expect(
      dispatchInvitationEmail(buildData()),
    ).rejects.not.toBeInstanceOf(InvitationError)

    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe("sendInvitationEmail — the callback awaits the transport", () => {
  beforeEach(() => {
    sendOrganizationInvitationEmail.fn.mockReset()
    sendOrganizationInvitationEmail.fn.mockImplementation(
      () => sendOrganizationInvitationEmail.dispatchPromise,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("stays pending while the transport is pending, then resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    // The resolver for the transport promise is held by this test, so
    // the callback can only settle once the test releases it. That is
    // the whole assertion: a fire-and-forget callback would resolve
    // during the flush below and the test would fail.
    let settled = false
    const result = sendInvitationEmail(buildData()).then(() => {
      settled = true
    })

    await flush()
    expect(sendOrganizationInvitationEmail.fn).toHaveBeenCalledTimes(1)
    expect(settled).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()

    sendOrganizationInvitationEmail.resolveDispatch({ ok: true })
    await result
    expect(settled).toBe(true)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("emits exactly one log on smtp_failed, and still resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)

    sendOrganizationInvitationEmail.fn.mockResolvedValueOnce({
      ok: false,
      error: "smtp_unavailable",
    })

    // A transport failure must never fail the request that created
    // the invitation, so the callback resolves rather than rejecting.
    await expect(sendInvitationEmail(buildData())).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(
      (consoleError.mock.calls[0]?.[1] as string) ?? "{}",
    )
    expect(payload.error_reason).toBe("smtp_failed")
    expect(payload.error).toBe("smtp_unavailable")
    expect(onUnhandled).not.toHaveBeenCalled()

    process.off("unhandledRejection", onUnhandled)
  })

  it("emits exactly one log on config_invalid, and still resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      sendInvitationEmail({ ...buildData(), id: "" }),
    ).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(
      (consoleError.mock.calls[0]?.[1] as string) ?? "{}",
    )
    expect(payload.error_reason).toBe("config_invalid")
    expect(sendOrganizationInvitationEmail.fn).not.toHaveBeenCalled()
  })

  it("files an untyped failure under dispatch_rejected and still resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    sendOrganizationInvitationEmail.fn.mockRejectedValueOnce(
      new TypeError("composition exploded"),
    )

    await expect(sendInvitationEmail(buildData())).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(
      (consoleError.mock.calls[0]?.[1] as string) ?? "{}",
    )
    expect(payload.error_reason).toBe("dispatch_rejected")
    expect(payload.error).toBe("composition exploded")
  })
})