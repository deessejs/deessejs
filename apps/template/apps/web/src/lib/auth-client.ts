/**
 * Better Auth React client. The single frontend entry point for
 * authentication — sign-in, sign-up, sign-out, password reset,
 * email verification, and reactive `useSession()`.
 *
 * Mounted on the Hono app at `/api/auth/*` (see `apps/web/app/api/[[...route]]/route.ts`).
 * The client just calls the same endpoints; the Better Auth server does
 * the work. The `baseURL` must match the server's `BETTER_AUTH_URL`
 * (which defaults to the app's `NEXT_PUBLIC_APP_URL` in dev).
 *
 * Per docs/internal/architecture/01-stack/better-auth.md.
 */

import { createAuthClient } from "better-auth/react"

import { publicEnv } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: publicEnv.appUrl,
})

/**
 * Destructure the methods used across the app. Importing from this
 * module keeps call sites short (`signIn.email(...)` rather than
 * `authClient.signIn.email(...)`) and gives us one place to swap
 * implementations or add a cross-cutting concern (logging, retries).
 */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient
