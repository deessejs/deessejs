/**
 * Canonical URLs for the DeesseJS Cloud app.
 * Single source of truth — import from here, never hardcode.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
export const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ?? "https://deessejs.com";
export const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.deessejs.com";
