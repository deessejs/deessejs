/**
 * Normalize a redirect target into a guaranteed-safe relative path.
 *
 * Use this anywhere a redirect destination is accepted from user input
 * (URL query parameter, OAuth callbackURL prop, searchParams, etc.) before
 * passing it to `router.push`, `NextResponse.redirect`, `signIn.social`'s
 * `callbackURL`, or any other API that ultimately issues a 3xx to the
 * user's browser.
 *
 * ## Threat model
 *
 * Browsers normalize protocol-relative URLs (`//evil.com`) as fully qualified.
 * Some browsers also normalize `\` as `/`, so `/\\evil.com` is equivalent to
 * `//evil.com` in some cases. This helper blocks both vectors.
 *
 * ## Caveats
 *
 * - Returns a path string. The fragment and query are *not* validated for
 *   javascript: schemes — but fragments and queries are client-side only and
 *   cannot trigger a server-side redirect to an attacker origin.
 * - This is a defense-in-depth layer on top of Better Auth's `originCheck`
 *   middleware (which validates `callbackURL` against `trustedOrigins`).
 *   The library may regress; this helper will not.
 *
 * @example
 *   safeRedirect(searchParams.get('redirect'))  // → '/safe/path' or '/'
 *   safeRedirect('//evil.com', '/login')        // → '/login' (rejected)
 *   safeRedirect('/dashboard')                  // → '/dashboard' (unchanged)
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback: string = "/",
): string {
  if (typeof target !== "string" || target.length === 0) return fallback
  // Must be a relative path. Reject fully-qualified URLs.
  if (!target.startsWith("/")) return fallback
  // Reject protocol-relative URLs: //evil.com is interpreted as https://evil.com
  // by browsers. This was the canonical CVE-2025-27143 vector.
  if (target.startsWith("//")) return fallback
  // Reject backslash variants: some browsers normalize \ to /. /\\evil.com is
  // equivalent to //evil.com on those browsers.
  if (target.includes("\\")) return fallback
  return target
}