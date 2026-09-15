/**
 * Enterprise inquiry FAQ.
 *
 * Single source of truth — the visible Accordion and the FAQPage
 * JSON-LD both consume this array, so they can never drift.
 *
 * Copy is provisional — adjust the wording once the founding team
 * commits to specific security / procurement / SLA promises. The
 * JSON-LD schema stays the same either way.
 */
export type EnterpriseFaqItem = {
  question: string
  answer: string
}

export const ENTERPRISE_FAQ: ReadonlyArray<EnterpriseFaqItem> = [
  {
    question: "How does the senior engineer commitment work?",
    answer:
      "A senior engineer is assigned to your engagement for its full duration. They join the channel you choose, attend weekly syncs, and own every template shipped. Issues route to a person, not a queue.",
  },
  {
    question: "Can we sign a mutual NDA before the first call?",
    answer:
      "Yes. Send your NDA to support@deessejs.com and we will return a countersigned copy within one business day. We do not require your business case or technical context to start the conversation.",
  },
  {
    question: "Do you support SSO and SAML on the Pro package?",
    answer:
      "SAML and OIDC are supported on every Pro template via Better Auth. Custom IdP integration (Okta, Entra ID, Google Workspace) is part of the standard delivery and included in scope.",
  },
  {
    question: "What is a typical engagement size?",
    answer:
      "Most engagements span 4 to 12 weeks. Single-template scaffolding fits in two to four weeks; multi-template bundles and full-stack migrations sit at the upper end. We will scope a timeline during the first call.",
  },
  {
    question: "How do we migrate off a custom engagement when the contract ends?",
    answer:
      "You own every line of code from day one. The Pro license continues for the lifetime of your account, so the source stays in your repository regardless of the engagement outcome. There is no lock-in.",
  },
  {
    question: "Where is the data hosted, and which providers do you ship against?",
    answer:
      "Pro templates default to Postgres on Neon or Supabase, with Cloudflare for object storage and edge runtime. We deploy against any provider you bring (Vercel, AWS, GCP, Fly, or self-hosted). Data residency is configurable per region.",
  },
  {
    question: "Do you sign DPAs and respond to security questionnaires?",
    answer:
      "Yes. We maintain a standard DPA and respond to vendor security questionnaires within five business days. Signed NDAs, security review packets, and procurement paperwork do not slow the engagement.",
  },
]
