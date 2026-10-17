import { APIError } from "better-auth/api"
import type { OrganizationOptions } from "better-auth/plugins/organization"

/**
 * Organization invitation email helper.
 *
 * Stub that throws a typed `CONFLICT / not_implemented` error.
 * The full implementation is responsible for `APP_URL` validation,
 * URL building, the React Email template, and delivery-error
 * logging.
 *
 * The data shape is derived from the `sendInvitationEmail` option
 * of `OrganizationOptions` so the stub matches the runtime contract
 * exactly; the implementation keeps the same type and tightens
 * the body.
 */
type SendInvitationEmailData = NonNullable<
  OrganizationOptions["sendInvitationEmail"]
> extends (data: infer D, ...args: infer _Rest) => unknown
  ? D
  : never

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function sendOrganizationInvitation(
  _data: SendInvitationEmailData,
): Promise<void> {
  throw new APIError("CONFLICT", {
    code: "not_implemented",
    message: "sendOrganizationInvitation is not implemented yet.",
  })
}
/* eslint-enable @typescript-eslint/no-unused-vars */
