import { mailer } from "./transport.js"
import { sendAuthEmail, type SendEmailResult } from "./send-auth-email.js"
import { VerifyEmail } from "./templates/verify-email.js"
import { ResetPassword } from "./templates/reset-password.js"
import { OrganizationInvitation } from "./templates/organization-invitation.js"
import {
  sendOrganizationInvitationEmail,
  type OrganizationInvitationEmail,
} from "./invitation.js"
import type { MailerTransport, SendArgs } from "./types.js"

export { mailer, type MailerTransport, type SendArgs }
export { sendAuthEmail, type SendEmailResult }
export {
  sendOrganizationInvitationEmail,
  type OrganizationInvitationEmail,
}

/**
 * Re-export the templates under a `templates` namespace for ergonomic imports
 * from packages/auth:
 *
 *   import { sendAuthEmail, templates } from "@workspace/email"
 *   templates.VerifyEmail({ url, userEmail: user.email })
 *
 * A template that has a dedicated `send*` composition function belongs to
 * that function, not here: callers should not have to rebuild the subject
 * and the provider tags themselves.
 */
export const templates = {
	VerifyEmail,
	ResetPassword,
	OrganizationInvitation,
}