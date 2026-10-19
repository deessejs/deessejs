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

describe("sendInvitationEmail — non-blocking dispatch by construction", () => {
  beforeEach(() => {
    sendAuthEmail.fn.mockReset()
    sendAuthEmail.fn.mockImplementation(() => sendAuthEmail.smtpPromise)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.VERCEL
  })

  it("resolves without waiting for SMTP (deliberately-pending promise)", async () => {
    // The test holds the resolver and never calls it. If
    // sendInvitationEmail awaited the SMTP promise, the
    // `await sendInvitationEmail(...)` would hang (the resolver
    // is in this test's hand, untouched). The fact that the
    // returned promise resolves proves the callback did not wait.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = sendInvitationEmail(buildData())
    await result
    expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("emits exactly one log on smtp_threw, no unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const onUnhandled = vi.fn()
    process.on("unhandledRejection", onUnhandled)

    sendAuthEmail.fn.mockRejectedValueOnce(new Error("smtp exploded"))
    const result = sendInvitationEmail(buildData())
    await result

    // Wait one microtask cycle for the .catch to fire.
    await Promise.resolve()
    await Promise.resolve()

    expect(consoleError).toHaveBeenCalledTimes(1)
    const payload = JSON.parse((consoleError.mock.calls[0]?.[1] as string) ?? "{}")
    expect(payload.error_reason).toBe("smtp_threw")
    expect(onUnhandled).not.toHaveBeenCalled()

    process.off("unhandledRejection", onUnhandled)
  })
})
