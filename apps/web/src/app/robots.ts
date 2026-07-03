import type { MetadataRoute } from "next";

import { WEB_URL } from "@/lib/urls";

/**
 * robots.txt — allows all crawlers including AI search bots.
 *
 * AI search bots to allow:
 * - GPTBot / OAI-SearchBot / ChatGPT-User (OpenAI / ChatGPT)
 * - ClaudeBot / Claude-SearchBot / Claude-User (Anthropic / Claude)
 * - PerplexityBot / Perplexity-User (Perplexity)
 * - Googlebot / Google-Extended (Google Search + AI Overviews)
 * - Bravebot (Brave Search — used by Claude's web search)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/app/"],
      },
      // OpenAI
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      // Anthropic
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
      },
      {
        userAgent: "Claude-User",
        allow: "/",
      },
      // Perplexity
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      // Google
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      // Brave Search (used by Claude for web search)
      {
        userAgent: "Bravebot",
        allow: "/",
      },
    ],
    sitemap: `${WEB_URL}/sitemap.xml`,
  };
}
