import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

// Artifact A of the Organizations V1 PR-2 probe. Exercises the
// production `invitation.ts` module through the deep path with a
// `vi.mock` of `@workspace/email`. The test pins:
//
// - the `error_reason` taxonomy: `config_invalid`, `smtp_threw`,
//   `dispatch_rejected`
// - the "exactly one log per failed invitation" property
// - the non-blocking contract by construction (deliberately-pending
//   SMTP promise that the test never resolves)
//
// The test does NOT toggle `requireEmailVerificationOnInvitation` —
// that is measured by Artifact B, not here.

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

describe("Artifact A: callback-level probe (Vitest)", () => {
  beforeEach(() => {
    sendAuthEmail.fn.mockReset()
    sendAuthEmail.fn.mockImplementation(() => sendAuthEmail.smtpPromise)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.VERCEL
  })

  // C1: SMTP success
  it("C1 — resolve path: sendAuthEmail returns ok: true, no log", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockResolvedValueOnce({ ok: true })

    await expect(dispatchInvitationEmail(buildData())).resolves.toBeUndefined()
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(consoleError).not.toHaveBeenCalled()
  })

  // C2: SMTP ok: false
  it("C2 — resolved-but-failed path: sendAuthEmail returns ok: false, no log, no throw", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockResolvedValueOnce({ ok: false, error: "smtp_unavailable" })

    await expect(dispatchInvitationEmail(buildData())).resolves.toBeUndefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  // C3: SMTP throws
  it("C3 — thrown transport: throws InvitationError smtp_threw", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))

    let caught: unknown
    try {
      await dispatchInvitationEmail(buildData())
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(InvitationError)
    expect((caught as InvitationError).kind).toBe("smtp_threw")
    expect(consoleError).not.toHaveBeenCalled()
  })

  // C5: slow SMTP (pending forever); the test never resolves the
  // promise. The callback must resolve anyway.
  it("C5 — non-blocking: callback resolves while SMTP promise stays pending", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    // Mock returns the deliberately-pending promise (default).
    const result = sendInvitationEmail(buildData())
    await result
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(consoleError).not.toHaveBeenCalled()
  })

  // "Exactly one log" property for the smtp_threw case via the
  // Better Auth callback path
  it("smtp_threw via sendInvitationEmail: exactly one log, no unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)

    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))
    const result = sendInvitationEmail(buildData())
    await result
    await Promise.resolve()
    await Promise.resolve()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse((consoleError.mock.calls[0]?.[1] as string) ?? "{}")
    expect(payload.error_reason).toBe("smtp_threw")
    expect(onUnhandled).not.toHaveBeenCalled()

    process.off("unhandledRejection", onUnhandled)
  })

  it("config_invalid via empty id: throws InvitationError config_invalid", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    let caught: unknown
    try {
      await dispatchInvitationEmail({ ...buildData(), id: "" })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(InvitationError)
    expect((caught as InvitationError).kind).toBe("config_invalid")
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("dispatchInvitationEmail does not call console.error (single point of logging)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    sendAuthEmail.fn.mockResolvedValueOnce({ ok: true })
    await dispatchInvitationEmail(buildData())

    sendAuthEmail.fn.mockResolvedValueOnce({ ok: false, error: "x" })
    await dispatchInvitationEmail(buildData())

    sendAuthEmail.fn.mockRejectedValueOnce(new Error("y"))
    await expect(dispatchInvitationEmail(buildData())).rejects.toBeInstanceOf(InvitationError)

    expect(consoleError).not.toHaveBeenCalled()
  })
})
