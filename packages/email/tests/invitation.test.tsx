import { render } from "@react-email/components"
import { describe, expect, it, vi } from "vitest"

// The composition function's job is to build the whole message: subject,
// React tree, provider tags. This test spies on the generic sender so the
// assertions can read that composition directly, rather than reaching a
// transport.
const sendAuthEmail = vi.hoisted(() => vi.fn(async () => ({ ok: true as const })))

vi.mock("../src/send-auth-email.js", () => ({ sendAuthEmail }))

const { sendOrganizationInvitationEmail } = await import("../src/invitation.js")

const args = {
  to: "invitee@example.com",
  url: "https://app.example.com/accept-invitation/inv_123",
  organizationName: "Acme",
  inviterName: "Ada",
  expiresAt: new Date("2026-10-22T12:00:00.000Z"),
}

describe("sendOrganizationInvitationEmail", () => {
  it("builds the subject from the organization name", async () => {
    await sendOrganizationInvitationEmail(args)
    expect(sendAuthEmail).toHaveBeenCalledTimes(1)
    expect(sendAuthEmail.mock.calls[0]?.[0]).toMatchObject({
      to: "invitee@example.com",
      subject: "Invitation to join Acme",
    })
  })

  it("tags the message so the provider can group it", async () => {
    await sendOrganizationInvitationEmail(args)
    expect(sendAuthEmail.mock.calls[0]?.[0]).toMatchObject({
      tags: [{ name: "flow", value: "organization-invitation" }],
    })
  })

  it("renders the template into the body", async () => {
    await sendOrganizationInvitationEmail(args)
    const html = await render(sendAuthEmail.mock.calls[0]?.[0]?.react as React.ReactElement)
    expect(html).toContain(args.url)
    expect(html).toContain("Acme")
    expect(html).toContain("Ada")
  })

  it("forwards the transport result unchanged, including ok: false", async () => {
    sendAuthEmail.mockResolvedValueOnce({ ok: false, error: "smtp_unavailable" })
    await expect(sendOrganizationInvitationEmail(args)).resolves.toEqual({
      ok: false,
      error: "smtp_unavailable",
    })
  })
})