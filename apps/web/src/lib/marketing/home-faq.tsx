/**
 * FAQ items rendered on the marketing homepage (Section 14).
 *
 * Extracted from page.tsx so the page file does not embed ~75 lines
 * of AccordionItems. Each item carries a stable `value` for the
 * accordion widget and rich-text content via JSX (links rendered with
 * the mono inline class to match the original styling).
 */

import * as React from "react"

export type FaqItem = {
  /** Stable value for AccordionItem's controlled state. */
  value: string
  question: string
  /** Rich content (JSX) — keeps inline code styling consistent. */
  answer: React.ReactNode
}

export const HOME_FAQ: ReadonlyArray<FaqItem> = [
  {
    value: "what-is-deessejs",
    question: "What is DeesseJS?",
    answer:
      "DeesseJS is a registry of production-grade templates for SaaS, AI agents, mobile, desktop, CLIs, APIs, blogs, and e-commerce. Each template ships with the same six contracts wired (auth, database, billing, jobs, storage, observability) and the same AI-friendly conventions so a coding agent can extend it without re-discovering the boilerplate.",
  },
  {
    value: "is-deessejs-free",
    question: "Is DeesseJS free to use?",
    answer:
      "The templates and the CLI are MIT-licensed and free. Install any template, modify it, ship it as your product. The delivery service (we ship it with you) is a paid engagement scoped per project. Contact us for a quote.",
  },
  {
    value: "how-it-works",
    question: "How does the CLI work?",
    answer: (
      <>
        Run{" "}
        <span className="font-mono text-foreground/90">
          npx @deessejs/cli@latest init my-project --template=saas-starter
        </span>{" "}
        to scaffold a new project with every contract pre-wired. Use{" "}
        <span className="font-mono text-foreground/90">list</span> to browse the
        registry and <span className="font-mono text-foreground/90">info</span>{" "}
        to verify the contracts in your project are present and in sync.
      </>
    ),
  },
  {
    value: "ai-first",
    question: "What does AI-first actually mean?",
    answer:
      "Every template ships with an AGENTS.md file at the monorepo root, an MCP manifest exposing the project tools, typed contracts end-to-end, and a layout an agent can navigate without guessing. Your coding agent reads the contracts, builds on them, and cannot break them.",
  },
  {
    value: "ship-with-us",
    question: "What does \"ship with us\" mean?",
    answer:
      "Same templates, same contracts, same guarantees as the self-service path, applied to a specific customer outcome. Our delivery team runs the build with you, you ship to your customers. You keep the code and the contracts at the end.",
  },
  {
    value: "lock-in",
    question: "Is there vendor lock-in?",
    answer:
      "No. Every template is MIT-licensed and self-hosted. The contracts are interface-only: swap Stripe for Lemon Squeezy, Upstash for Trigger.dev, Sentry for Better Stack without changing your code. The CLI is the only shared surface and works fully offline.",
  },
]
