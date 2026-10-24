/**
 * FAQ items rendered on the marketing homepage (Section 14).
 *
 * Extracted from page.tsx so the page file does not embed ~75 lines
 * of AccordionItems. Each item carries a stable `value` for the
 * accordion widget and rich-text content via JSX (links rendered with
 * the mono inline class to match the original styling).
 */

import * as React from "react"
import Link from "next/link"

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
      "DeesseJS is a registry of production-grade templates for SaaS, AI agents, mobile, desktop, CLIs, APIs, blogs, and e-commerce. Every template ships with the same AI-friendly conventions so a coding agent can extend it without re-discovering the boilerplate.",
  },
  {
    value: "is-deessejs-free",
    question: "Is DeesseJS free to use?",
    answer: (
      <>
        It depends on which tier you pick.{" "}
        <Link
          href="/pricing"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Full breakdown on /pricing
        </Link>
        . In short: the Community templates and the CLI are MIT-licensed and
        free. The Professional plan unlocks the full Pro catalog for $29 / month
        or $299 / year, every project you ship while subscribed. The Agency
        &amp; Team plan covers 5 seats and adds a Commercial Extended License
        that lets you re-sell to your clients without attribution. The
        delivery service (we ship it with you) is a separate engagement
        scoped per project.
      </>
    ),
  },
  {
    value: "how-it-works",
    question: "How does the CLI work?",
    answer: (
      <>
        Install it globally with <code>npm install -g deessejs</code> and
        run <code>deessejs init &lt;template-slug&gt;</code> to scaffold.
        The full walkthrough (install, authenticate, list, init) lives in{" "}
        <Link
          href="/knowledge-base/guides/install-deessejs-cli"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          the install guide
        </Link>
        .
      </>
    ),
  },
  {
    value: "ai-first",
    question: "What does AI-first actually mean?",
    answer:
      "You can fire your coding agent on a fresh clone and it ships the same way you would. The contracts are typed at every boundary, RBAC enforces who can touch what, AGENTS.md documents the conventions, and the MCP manifest exposes the project tools. The agent cannot break the contracts, and cannot escalate beyond its role.",
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
