import { render } from "@react-email/components"
import { describe, expect, it } from "vitest"
import { VerifyEmail } from "../src/templates/verify-email.jsx"
import { ResetPassword } from "../src/templates/reset-password.jsx"
import { OrganizationInvitation } from "../src/templates/organization-invitation.jsx"
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

  it("OrganizationInvitation renders the link, the organization, and the inviter", async () => {
    const url = "https://app.example.com/accept-invitation/inv_123"
    const html = await render(
      <OrganizationInvitation
        url={url}
        organizationName="Acme"
        inviterName="Ada"
        expiresAt={new Date("2026-10-22T12:00:00.000Z")}
      />,
    )
    expect(html).toContain(url)
    expect(html).toContain("Acme")
    expect(html).toContain("Ada")
  })

  it("OrganizationInvitation states the expiry as an absolute UTC date", async () => {
    // A locale-formatted date would make the rendered output depend on
    // the host timezone, so the ISO day is pinned here.
    const html = await render(
      <OrganizationInvitation
        url="https://app.example.com/accept-invitation/inv_123"
        organizationName="Acme"
        inviterName="Ada"
        expiresAt={new Date("2026-10-22T23:30:00.000Z")}
      />,
    )
    expect(html).toContain("2026-10-22")
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