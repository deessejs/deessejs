"use client";

/**
 * Client-safe accessors for public URLs.
 * Use in "use client" components where process.env isn't available
 * at the module level.
 */
export function usePublicUrl() {
  return {
    webUrl: process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000",
    docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.deessejs.com",
    demoUrl: process.env.NEXT_PUBLIC_DEMO_URL ?? "https://demo.deessejs.com",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002",
  };
}
