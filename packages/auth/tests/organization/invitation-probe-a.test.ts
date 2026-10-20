import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

// Artifact A of the invitation probe. Exercises the production
// `invitation.ts` module through the deep path with a `vi.mock` of
// `@workspace/email`. The test pins:
//
// - the `error_reason` taxonomy: `config_invalid`, `smtp_threw`,
//   `dispatch_rejected`
// - the "exactly one log per failed invitation" property
// - that the callback awaits the transport, and that it still
//   resolves (never rejects) when the transport fails
//
// The test does NOT toggle `requireEmailVerificationOnInvitation`:
// that is measured at the endpoint level, in
// `invitation-contract.test.ts`.

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

  // C5: the callback awaits the transport. The SMTP promise is held
  // pending by this test, so the callback can only settle once the
  // test releases it.
  it("C5 — the callback stays pending while the SMTP promise is pending", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    let settled = false
    const result = sendInvitationEmail(buildData()).then(() => {
      settled = true
    })

    for (let i = 0; i < 5; i++) await Promise.resolve()
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(settled).toBe(false)

    sendAuthEmail.resolveSmtp({ ok: true })
    await result
    expect(settled).toBe(true)
    expect(consoleError).not.toHaveBeenCalled()
  })

  // "Exactly one log" property for the smtp_threw case via the
  // Better Auth callback path
  it("smtp_threw via sendInvitationEmail: exactly one log, no unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)

    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))
    await sendInvitationEmail(buildData())

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse((consoleError.mock.calls[0]?.[1] as string) ?? "{}")
    expect(payload.error_reason).toBe("smtp_threw")
    expect(onUnhandled).not.toHaveBeenCalled()

    process.off("unhandledRejection", onUnhandled)
  })

  // The full taxonomy, observed through the callback. Each case
  // asserts both the `error_reason` bucket and that exactly one log
  // was produced, because "at most one log per failed invitation"
  // is a separate claim from "the right bucket was chosen".
  describe("error_reason taxonomy through the callback", () => {
    const readLog = (consoleError: ReturnType<typeof vi.spyOn>) => {
      expect(consoleError).toHaveBeenCalledTimes(1)
      const [, payload] = consoleError.mock.calls[0] as [string, string]
      return JSON.parse(payload) as {
        recipient_email: string
        inviter_user_id: string
        organization_id: string
        error_reason: string
        error: string
      }
    }

    it("config_invalid: a configuration failure never reaches SMTP", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      await sendInvitationEmail({ ...buildData(), id: "" })

      const payload = readLog(consoleError)
      expect(payload.error_reason).toBe("config_invalid")
      expect(payload.recipient_email).toBe("invitee@example.com")
      expect(payload.inviter_user_id).toBe("user-1")
      expect(payload.organization_id).toBe("org-1")
      expect(sendAuthEmail.fn).not.toHaveBeenCalled()
    })

    it("smtp_threw: a transport rejection is filed under the transport bucket", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))

      await sendInvitationEmail(buildData())

      expect(readLog(consoleError).error_reason).toBe("smtp_threw")
      expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    })

    it("dispatch_rejected: an untyped failure is not mislabelled as an SMTP failure", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      // `organization` is null, so reading `.name` while building the
      // subject throws a TypeError. The payload is assembled outside
      // the transport try/catch precisely so this surfaces untyped
      // and lands in `dispatch_rejected` rather than `smtp_threw`.
      await sendInvitationEmail({
        ...buildData(),
        organization: null,
      } as unknown as Parameters<typeof sendInvitationEmail>[0])

      expect(readLog(consoleError).error_reason).toBe("dispatch_rejected")
      expect(sendAuthEmail.fn).not.toHaveBeenCalled()
    })

    it("a successful send produces no log at all", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      sendAuthEmail.fn.mockResolvedValueOnce({ ok: true })

      await sendInvitationEmail(buildData())

      expect(consoleError).not.toHaveBeenCalled()
    })

    it("a resolved-but-failed transport produces no log either", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      sendAuthEmail.fn.mockResolvedValueOnce({ ok: false, error: "smtp_unavailable" })

      await sendInvitationEmail(buildData())

      expect(consoleError).not.toHaveBeenCalled()
    })
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
