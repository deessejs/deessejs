import { render } from "@react-email/components"
import { describe, expect, it } from "vitest"
import { VerifyEmail } from "../src/templates/verify-email.jsx"
import { ResetPassword } from "../src/templates/reset-password.jsx"

describe("templates", () => {
  it("VerifyEmail renders without crashing and contains the URL", async () => {
    const url = "https://app.example.com/verify?token=abc"
    const html = await render(<VerifyEmail url={url} userEmail="u@x.com" />)
    expect(html).toContain(url)
    expect(html).toContain("Verify")
  })

  it("ResetPassword renders and contains the URL", async () => {
    const url = "https://app.example.com/reset?token=xyz"
    const html = await render(<ResetPassword url={url} userEmail="u@x.com" />)
    expect(html).toContain(url)
    expect(html).toContain("Reset")
  })
})