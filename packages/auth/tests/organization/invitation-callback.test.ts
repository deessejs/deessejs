import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

// `vi.mock` is hoisted above this import. The factory is shared with
// the test body via `vi.hoisted` so the same `vi.fn()` reference is
// available to both the hoisted mock factory and the assertions.
const sendAuthEmail = vi.hoisted(() => {
  let resolveSmtp!: () => void
  let rejectSmtp!: (e: unknown) => void
  const smtpPromise = new Promise<{ ok: true }>((res, rej) => {
    resolveSmtp = res
    rejectSmtp = rej
  })
  const fn = vi.fn(() => smtpPromise)
  return { fn, smtpPromise, resolveSmtp, rejectSmtp }
})

vi.mock("@workspace/email", () => ({ sendAuthEmail: sendAuthEmail.fn }))

// Imports below run after vi.mock is hoisted.
const { dispatchInvitationEmail, sendInvitationEmail, InvitationError } = await import(
  "../../src/organization/invitation.js"
)

const buildData = () => ({
  id: "inv-1",
  role: "member" as const,
  email: "invitee@example.com",
  organization: { id: "org-1", name: "Acme" },
  invitation: { expiresAt: new Date("2030-01-01T00:00:00Z"), email: "invitee@example.com" },
  inviter: { user: { id: "user-1" } },
})

describe("dispatchInvitationEmail", () => {
  beforeEach(() => {
    sendAuthEmail.fn.mockReset()
    sendAuthEmail.fn.mockImplementation(() => sendAuthEmail.smtpPromise)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("throws InvitationError config_invalid on empty id", async () => {
    await expect(
      dispatchInvitationEmail({ ...buildData(), id: "" }),
    ).rejects.toBeInstanceOf(InvitationError)
  })

  it("resolves when sendAuthEmail returns ok: true", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockResolvedValueOnce({ ok: true })
    await expect(dispatchInvitationEmail(buildData())).resolves.toBeUndefined()
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("resolves (no throw, no log) when sendAuthEmail returns ok: false", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockResolvedValueOnce({ ok: false, error: "smtp_unavailable" })
    await expect(dispatchInvitationEmail(buildData())).resolves.toBeUndefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("throws InvitationError smtp_threw when sendAuthEmail rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))
    await expect(dispatchInvitationEmail(buildData())).rejects.toBeInstanceOf(InvitationError)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

/** Drain the microtask queue so pending continuations run. */
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe("sendInvitationEmail — the callback awaits the transport", () => {
  beforeEach(() => {
    sendAuthEmail.fn.mockReset()
    sendAuthEmail.fn.mockImplementation(() => sendAuthEmail.smtpPromise)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("stays pending while the transport is pending, then resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    // The resolver for the SMTP promise is held by this test, so the
    // callback can only settle once the test releases it. That is the
    // whole assertion: a fire-and-forget callback would resolve during
    // the flush below and the test would fail.
    let settled = false
    const result = sendInvitationEmail(buildData()).then(() => {
      settled = true
    })

    await flush()
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(settled).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()

    sendAuthEmail.resolveSmtp({ ok: true })
    await result
    expect(settled).toBe(true)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("emits exactly one log on smtp_threw, and still resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)

    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))

    // A transport failure must never fail the request that created
    // the invitation, so the callback resolves rather than rejecting.
    await expect(sendInvitationEmail(buildData())).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse((consoleError.mock.calls[0]?.[1] as string) ?? "{}")
    expect(payload.error_reason).toBe("smtp_threw")
    expect(onUnhandled).not.toHaveBeenCalled()

    process.off("unhandledRejection", onUnhandled)
  })
})
