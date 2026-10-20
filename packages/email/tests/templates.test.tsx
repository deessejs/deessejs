import { render } from "@react-email/components"
import { describe, expect, it } from "vitest"
import { VerifyEmail } from "../src/templates/verify-email.jsx"
import { ResetPassword } from "../src/templates/reset-password.jsx"
import { PlaybookDownload } from "../src/templates/playbook.jsx"

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

  describe("PlaybookDownload", () => {
    const pdfUrl = "https://deessejs.com/playbook.pdf"

    it("carries the PDF url", async () => {
      const html = await render(
        <PlaybookDownload pdfUrl={pdfUrl} consentMarketing={false} />,
      )
      expect(html).toContain(pdfUrl)
    })

    it("omits the opt-in paragraph when there was no consent", async () => {
      const html = await render(
        <PlaybookDownload pdfUrl={pdfUrl} consentMarketing={false} />,
      )
      expect(html).not.toContain("opted in")
    })

    it("points at the unsubscribe link in the marketing emails only", async () => {
      const html = await render(
        <PlaybookDownload pdfUrl={pdfUrl} consentMarketing={true} />,
      )
      expect(html).toContain("opted in")
      expect(html).toContain("our marketing emails")
      // This email goes out through the transactional send API, where
      // Resend does not manage subscriptions. Promising a link at the
      // bottom of every email would be false here, since this one has
      // no unsubscribe link of its own.
      expect(html).not.toContain("any email we send")
    })
  })
})