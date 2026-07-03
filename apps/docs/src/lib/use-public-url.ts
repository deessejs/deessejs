"use client";

/**
 * Client-safe accessors for public URLs.
 */
export function usePublicUrl() {
  return {
    docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001",
    webUrl: process.env.NEXT_PUBLIC_WEB_URL ?? "https://deessejs.com",
    demoUrl: process.env.NEXT_PUBLIC_DEMO_URL ?? "https://demo.deessejs.com",
  };
}
