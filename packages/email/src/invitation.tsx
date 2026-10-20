import { sendAuthEmail, type SendEmailResult } from "./send-auth-email.js"
import { OrganizationInvitation } from "./templates/organization-invitation.js"

export interface OrganizationInvitationEmail {
  /** Address of the invitee. */
  to: string
  /** Absolute link to the accept-invitation page. */
  url: string
  organizationName: string
  /**
   * Display name of whoever sent the invitation. Better Auth's `user.name`
   * is nullable, so the caller resolves the fallback rather than passing
   * `null` through to a template that has to render something.
   */
  inviterName: string
  expiresAt: Date
}

/**
 * Compose and send an organization invitation.
 *
 * Everything about the message lives here: the subject, the React tree,
 * and the provider tags. The caller supplies only invitation data and
 * the link it built. That keeps React Email out of the calling package,
 * which is the whole reason this package exists.
 *
 * The result is `sendAuthEmail`'s, forwarded unchanged: `{ ok: false }`
 * here means the transport refused or failed, and the caller is the only
 * layer that knows how to report that against an invitation id.
 */
export async function sendOrganizationInvitationEmail(
  opts: OrganizationInvitationEmail,
): Promise<SendEmailResult> {
  return sendAuthEmail({
    to: opts.to,
    subject: `Invitation to join ${opts.organizationName}`,
    react: (
      <OrganizationInvitation
        url={opts.url}
        organizationName={opts.organizationName}
        inviterName={opts.inviterName}
        expiresAt={opts.expiresAt}
      />
    ),
    tags: [{ name: "flow", value: "organization-invitation" }],
  })
}