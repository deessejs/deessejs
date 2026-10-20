import { beforeEach, describe, expect, it, vi } from "vitest"
import { call } from "@orpc/server"

import { signup } from "../../src/orpc/routes/playbook.js"
import type { BaseContext } from "../../src/orpc/base-context.js"

/**
 * The email package is mocked wholesale: the Resend call and the
 * mailer are the two boundaries this suite cares about, and mocking
 * them keeps the test off the network and lets it assert on exactly
 * what the route sent.
 */
const { subscribeToPlaybookUpdates, mailerSend, envMock, loggerWarn } =
  vi.hoisted(() => ({
    subscribeToPlaybookUpdates: vi.fn(),
    mailerSend: vi.fn(),
    envMock: { WEB_URL: "https://deessejs.com" },
    loggerWarn: vi.fn(),
  }))

vi.mock("@workspace/email", () => ({
  subscribeToPlaybookUpdates,
  mailer: { send: mailerSend },
  templates: { PlaybookDownload: (props: unknown) => props },
}))

vi.mock("@workspace/env/server", () => ({ serverEnv: envMock }))

vi.mock("../../src/constants/logger.js", () => ({
  logger: { info: vi.fn(), warn: loggerWarn, error: vi.fn() },
}))

/**
 * The rate limit and the email dedup are in-memory and module-level,
 * so each case uses its own IP and its own address.
 */
let caseIndex = 0

const contextFor = (): BaseContext => {
  caseIndex += 1
  return {
    headers: new Headers({
      "x-forwarded-for": `203.0.113.${caseIndex}`,
    }),
    user: null,
    session: null,
    requestId: `req_test_${caseIndex}`,
  }
}

const signupWith = async (input: {
  email: string
  consentMarketing?: boolean
}) =>
  call(signup, input, { context: contextFor() })

describe("playbook signup: consent and delivery are independent", () => {
  beforeEach(() => {
    subscribeToPlaybookUpdates.mockReset()
    mailerSend.mockReset()
    loggerWarn.mockReset()
    subscribeToPlaybookUpdates.mockResolvedValue({ ok: true })
    mailerSend.mockResolvedValue({ id: "email_1" })
  })

  it("does not touch Resend when the visitor did not consent", async () => {
    const result = await signupWith({
      email: "noconsent@example.com",
      consentMarketing: false,
    })

    expect(result).toEqual({ ok: true })
    expect(subscribeToPlaybookUpdates).not.toHaveBeenCalled()
    expect(mailerSend).toHaveBeenCalledTimes(1)
  })

  it("subscribes the contact to the topic when the visitor consented", async () => {
    const result = await signupWith({
      email: "consent@example.com",
      consentMarketing: true,
    })

    expect(result).toEqual({ ok: true })
    expect(subscribeToPlaybookUpdates).toHaveBeenCalledTimes(1)
    expect(subscribeToPlaybookUpdates).toHaveBeenCalledWith({
      email: "consent@example.com",
      source: "playbook-page",
    })
  })

  it("still sends the PDF when the topic subscription fails", async () => {
    subscribeToPlaybookUpdates.mockResolvedValue({
      ok: false,
      reason: "api_error",
      error: "topic not found",
    })

    const result = await signupWith({
      email: "failing@example.com",
      consentMarketing: true,
    })

    // The PDF is the requested service, so a Resend failure cannot
    // block it. The failure is logged, not thrown.
    expect(result).toEqual({ ok: true })
    expect(mailerSend).toHaveBeenCalledTimes(1)
    expect(loggerWarn).toHaveBeenCalledWith(
      "playbook_topic_subscribe_skipped",
      expect.objectContaining({ reason: "api_error" }),
    )
  })

  it("sends the PDF with the playbook link and subject", async () => {
    await signupWith({
      email: "reader@example.com",
      consentMarketing: false,
    })

    const args = mailerSend.mock.calls[0]?.[0] as {
      to: string
      subject: string
      react: { pdfUrl: string; consentMarketing: boolean }
    }
    expect(args.to).toBe("reader@example.com")
    expect(args.subject).toBe("Your playbook from DeesseJS")
    expect(args.react.pdfUrl).toBe("https://deessejs.com/playbook.pdf")
    expect(args.react.consentMarketing).toBe(false)
  })
})
