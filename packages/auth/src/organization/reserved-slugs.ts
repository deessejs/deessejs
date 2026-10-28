/**
 * The slugs an organization may not take.
 *
 * A slug is a top-level URL segment, so a slug that matches one of
 * the application's own segments would shadow it: Next.js prefers a
 * static segment over a dynamic one, and the organization's pages
 * would become unreachable.
 *
 * The set lives in a module of its own because two very different
 * places need it. The policy enforces it when an organization is
 * created, and the request guard reads it to tell an application
 * route from an organization slug. The guard cannot import the policy,
 * because the policy sits next to Better Auth and the guard must not
 * drag the authentication stack into the browser bundle.
 *
 * This module imports nothing, so it is safe to import from anywhere.
 */

/** The top-level segments the application owns. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Top-level application segments
  "account",
  "admin",
  "onboarding",
  "accept-invitation",
  "api",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "verify-email",
  "device",
  "cookies",
  // The workspace entry point and the organizations page
  "home",
  "organizations",
  // Reserved by product / templates
  "deessejs",
  "nesalia",
])

/** Whether the slug is one the application owns. */
export const isReservedSlug = (slug: string): boolean =>
  RESERVED_SLUGS.has(slug)
