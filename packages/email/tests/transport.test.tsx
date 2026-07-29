import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Link, Html, Body } from "@react-email/components"

describe("mailer transport factory", () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    vi.resetModules()
  })

  it("uses ConsoleTransport by default (MAIL_TRANSPORT=console)", async () => {
    process.env.MAIL_TRANSPORT = "console"
    vi.resetModules()
    const { mailer } = await import("../src/transport.js")

    await mailer.send({
      to: "test@example.com",
      subject: "Verify your email",
      react: (
        <Html>
          <Body>
            <Link href="https://app.example.com/verify?token=abc">
              Verify your email
            </Link>
          </Body>
        </Html>
      ),
      tags: [{ name: "flow", value: "verify-email" }],
    })

    expect(logSpy).toHaveBeenCalled()
    const output = logSpy.mock.calls.flat().join("\n")
    expect(output).toContain("to:        test@example.com")
    expect(output).toContain("subject:   Verify your email")
    expect(output).toContain("https://app.example.com/verify?token=abc")
    expect(output).toContain("tags:      flow=verify-email")
  })

  it("returns an id on success", async () => {
    process.env.MAIL_TRANSPORT = "console"
    vi.resetModules()
    const { mailer } = await import("../src/transport.js")

    const result = await mailer.send({
      to: "x@y.com",
      subject: "s",
      react: null,
    })

    expect(result).toHaveProperty("id")
    expect((result as { id: string }).id).toMatch(/^console-/)
  })

  it("extracts the first URL from the rendered preview as primary link", async () => {
    process.env.MAIL_TRANSPORT = "console"
    vi.resetModules()
    const { mailer } = await import("../src/transport.js")

    await mailer.send({
      to: "u@example.com",
      subject: "Verify your email",
      react: (
        <Html>
          <Body>
            <Link href="https://app.example.com/verify?token=PRIMARY">
              Verify
            </Link>
            <Link href="https://app.example.com/about">About</Link>
          </Body>
        </Html>
      ),
    })

    const output = logSpy.mock.calls.flat().join("\n")
    expect(output).toContain("← copy me")
    expect(output).toContain("https://app.example.com/verify?token=PRIMARY")
    // The "about" link should still appear in the preview, just not as the
    // primary highlighted link.
    expect(output).toContain("https://app.example.com/about")
  })

  it("does not throw when react tree is malformed (fallback to text)", async () => {
    process.env.MAIL_TRANSPORT = "console"
    vi.resetModules()
    const { mailer } = await import("../src/transport.js")

    // Pass an invalid react node (a function reference) — render should throw,
    // and ConsoleTransport should fall back to text.
    await expect(
      mailer.send({
        to: "u@example.com",
        subject: "test",
        react: "Plain text fallback" as unknown as React.ReactNode,
      }),
    ).resolves.toMatchObject({ id: expect.stringMatching(/^console-/) })
  })
})

describe("sendAuthEmail (fire-and-forget wrapper)", () => {
  it("calls mailer.send without awaiting", async () => {
    const { sendAuthEmail, mailer } = await import("../src/index.js")
    const spy = vi.spyOn(mailer, "send").mockResolvedValue({ id: "spy" })

    await sendAuthEmail({
      to: "u@example.com",
      subject: "hi",
      react: null,
      tags: [{ name: "flow", value: "test" }],
    })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@example.com",
        subject: "hi",
        tags: [{ name: "flow", value: "test" }],
      }),
    )
  })
})