import { APIError } from "better-auth/api"
import { serverEnv } from "@workspace/env/server"

/**
 * Organization invitation email helper.
 *
 * PR-1 ships only the typed-error stub. The full implementation lands
 * in PR-6 and is responsible for:
 *
 * - Validating `serverEnv.APP_URL` is origin-only, HTTPS outside
 *   localhost, and matches the deployment. A misconfigured `APP_URL`
 *   is a hard rejection before the database is touched.
 *
 * - Building the absolute URL with `new URL("/accept-invitation/" +
 *   encodeURIComponent(data.id), serverEnv.APP_URL)`.
 *
 * - Rendering the OrganizationInvitation React Email template (added
 *   in PR-6) and calling `sendAuthEmail`.
 *
 * - Inspecting `{ ok, error }` from the mailer, logging the failure
 *   (with operational identifiers only — never the invitation id,
 *   the rendered URL, or any token), and resolving so the persisted
 *   invitation record stays authoritative.
 *
 * The PR-1 stub raises a typed `CONFLICT / not_implemented` error so
 * the smoke test in PR-1 sees a 409 and the route's throw semantics
 * are exercised end-to-end before PR-6 lands.
 */
export async function sendOrganizationInvitation(_data: {
  id: string
  email: string
  inviter?: { name?: string | null; email?: string }
  organization?: { name: string; slug: string }
}): Promise<void> {
  // Touch `serverEnv` so the import is preserved and the misconfigured
  // APP_URL detection path is wired (PR-6 reads APP_URL here).
  void serverEnv

  throw new APIError("CONFLICT", {
    code: "not_implemented",
    message:
      "sendOrganizationInvitation is not implemented in this increment; ships in a later PR.",
  })
}
