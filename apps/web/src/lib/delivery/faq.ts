/**
 * /delivery FAQ.
 *
 * Single source of truth. The visible Accordion and the FAQPage
 * JSON-LD both consume this array, so they cannot drift. Each
 * item addresses a real CTO concern that blocks a delivery
 * engagement purchase: existing-codebase takeover, IP, in-house
 * team dynamics, timezone.
 */
export type DeliveryFaqItem = {
  question: string
  answer: string
}

export const DELIVERY_FAQ: ReadonlyArray<DeliveryFaqItem> = [
  {
    question: "Can you take over an existing codebase, or only greenfield projects?",
    answer:
      "Both. Through our CLI (deessejs add) and the modular overlay system, we can inject new production modules (a new dashboard, a billing portal, multi-tenant auth) into an existing Next.js repository without breaking the current architecture. Sprint Kickstart is greenfield-first; Custom Architecture is typically an integration or refactor of an existing codebase.",
  },
  {
    question: "What happens if the engagement ends without shipping?",
    answer:
      "Impossible by design. We work in two-week sprints with daily Pull Requests merged into your own GitHub repository. You don't see the code on the last day, you test staging deployments from the end of week one.",
  },
  {
    question: "Do you replace our existing engineering team?",
    answer:
      "Never. We act as velocity unblockers. We lay the heavy, unpleasant architectural plumbing so your engineers can focus immediately on the specific business value of your product.",
  },
  {
    question: "Which cloud providers and databases do you ship against?",
    answer:
      "Pro templates default to Postgres on Neon or Supabase, with Cloudflare for storage and edge runtime. We deploy against any provider you bring: Vercel, AWS, GCP, Fly, or self-hosted.",
  },
  {
    question: "How do you handle NDAs and IP transfer?",
    answer:
      "Mutual NDA on first contact, countersigned within one business day. Day 1 IP transfer on every commit, no escrow, no platform lock-in.",
  },
  {
    question: "What is your timezone coverage?",
    answer:
      "US and European business hours. The senior engineer joins a shared Slack Connect or Microsoft Teams channel you already use. Weekly syncs are scheduled in your timezone.",
  },
]
