// Server Component wrapper around `<UserMenu>` (Client Component).
//
// ADR-028 Decision #4 — `withRelatedProject` reads
// `process.env.VERCEL_RELATED_PROJECTS` directly. Vercel injects
// that env var at runtime on the server (Node.js / Edge Functions),
// NOT in the browser bundle — so calling `withRelatedProject`
// from a Client Component silently falls back to `defaultHost`
// every time (the bundle never sees `VERCEL_RELATED_PROJECTS`).
//
// The fix is to resolve the preview URLs server-side and pass
// them down as serializable props:
//   - `appUrl` (the apps/app origin) is the base URL used to build
//     cross-app links (Log in / Sign up / Dashboard / Sign out).
//   - `apiBaseUrl` (the API origin) goes into the auth client via
//     `AuthClientProvider`.
//
// Both are computed once per RSC render on the server, then
// serialised into the RSC payload and read by the Client
// Components.

import { appUrl, apiBaseUrl } from "@/lib/preview-urls"
import { AuthClientProvider } from "./auth-client-provider"
import { UserMenu } from "./user-menu"

export function UserMenuServer({
  variant,
}: {
  variant: "desktop" | "mobile"
}) {
  return (
    <AuthClientProvider apiBaseUrl={apiBaseUrl}>
      <UserMenu variant={variant} baseUrl={appUrl} />
    </AuthClientProvider>
  )
}