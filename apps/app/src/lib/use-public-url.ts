"use client";

/**
 * Client-safe accessors for public URLs.
 */
export function usePublicUrl() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002",
    webUrl: process.env.NEXT_PUBLIC_WEB_URL ?? "https://deessejs.com",
    docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.deessejs.com",
    demoUrl: process.env.NEXT_PUBLIC_DEMO_URL ?? "https://demo.deessejs.com",
  };
}
