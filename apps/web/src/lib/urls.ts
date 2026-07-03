/**
 * Canonical URLs for the DeesseJS marketing site.
 * Single source of truth — import from here, never hardcode.
 *
 * Usage in server components: process.env.NEXT_PUBLIC_WEB_URL
 * Usage in client components: usePublicUrl() from "./use-public-url"
 */
export const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
export const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.deessejs.com";
export const DEMO_URL =
  process.env.NEXT_PUBLIC_DEMO_URL ?? "https://demo.deessejs.com";
