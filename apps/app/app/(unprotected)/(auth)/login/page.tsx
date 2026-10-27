import { safeRedirect } from "@workspace/utils/safe-redirect"

import { AuthContainer, LoginForm } from "@/components/auth"

/**
 * Login page (RFC: "DeesseJS Administration Routes — V1" §6.5).
 *
 * Resolves a safe post-login return target from the `redirect` query
 * parameter that the proxy writes when bouncing an unauthenticated
 * visitor away from a protected route (see `apps/app/proxy.ts`). The
 * raw input is funneled through `safeRedirect` to defeat
 * protocol-relative (`//evil.com`) and backslash (`/\\evil.com`)
 * bypass vectors — the same defense the OAuth path uses. The
 * `fallback` is `/home` so a missing or malformed parameter lands
 * the user on the standard post-login destination, matching the
 * pre-existing behaviour of `<LoginForm />` and `<OAuthButtons />`.
 *
 * The resolved target is passed down to `<LoginForm redirectTo />`,
 * which threads it into the email `onSuccess` navigation and the
 * OAuth `callbackURL` prop. The form does its own `safeRedirect`
 * pass to satisfy the workspace Oxlint guard
 * (`.oxlintrc.json`).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>
}) {
  const params = await searchParams
  const rawRedirect = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect
  const redirectTo = safeRedirect(rawRedirect, "/home")

  return (
    <AuthContainer.Root>
      <AuthContainer.Header
        title="Log in"
        description="Enter your credentials to access your account."
      />
      <AuthContainer.Content>
        <LoginForm redirectTo={redirectTo} />
      </AuthContainer.Content>
    </AuthContainer.Root>
  )
}
