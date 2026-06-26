import type { FeatureCategory } from "./types"

/**
 * Feature matrix for the /pricing page.
 *
 * Pattern: shadcn.io pricing-feature-matrix (April 2026) — 5 categories,
 * 4-6 rows each, ~26 rows total. Quantitative deltas where they exist;
 * booleans collapsed to "all tiers include X" rows where appropriate.
 *
 * Order of `values` MUST match the order of `tiers` in data.ts:
 *   [starter, pro, team]
 *
 * "All tiers" rows are kept for buyer reassurance but the value type is
 * typically `text` per tier rather than a per-tier boolean.
 */
export const featureCategories: FeatureCategory[] = [
  {
    name: "Core platform",
    description: "The runtime every tier ships with.",
    rows: [
      {
        label: "Auth (email + OAuth + passkeys + 2FA)",
        hint: "Better Auth with per-tenant session policies. Passkeys via WebAuthn.",
        values: [true, true, true],
      },
      {
        label: "Database (Postgres + Drizzle ORM)",
        hint: "Schemas, migrations, and seed scripts wired from day one.",
        values: [true, true, true],
      },
      {
        label: "Backend (Hono + oRPC)",
        hint: "End-to-end typed API without codegen. OpenAPI spec generation included.",
        values: [true, true, true],
      },
      {
        label: "Storage",
        hint: "S3-compatible providers (Cloudflare R2 by default; AWS / MinIO supported).",
        values: [
          { kind: "text", value: "Cloudflare R2" },
          { kind: "text", value: "Cloudflare R2 + S3" },
          { kind: "text", value: "Cloudflare R2 + S3 + per-tenant buckets" },
        ],
      },
      {
        label: "Background jobs",
        hint: "Trigger.dev for long-running, QStash for short-lived edge jobs.",
        values: [
          { kind: "text", value: "Trigger.dev + QStash" },
          { kind: "text", value: "Trigger.dev + QStash + cron" },
          {
            kind: "text",
            value: "Trigger.dev + QStash + cron + per-tenant queues",
          },
        ],
      },
      {
        label: "Billing (Stripe)",
        values: [
          { kind: "text", value: "Per-seat + metered" },
          { kind: "text", value: "Per-seat + metered + trials + coupons" },
          { kind: "text", value: "Per-tenant Stripe Connect" },
        ],
      },
    ],
  },
  {
    name: "Team & collaboration",
    description: "Differences that matter as your team grows.",
    rows: [
      {
        label: "Seats included",
        values: [
          { kind: "text", value: "1" },
          { kind: "text", value: "5" },
          { kind: "text", value: "Unlimited" },
        ],
      },
      {
        label: "Admin dashboard + user management",
        values: [false, true, true],
      },
      {
        label: "Multi-tenant architecture",
        hint: "Per-tenant data isolation, routing, and config.",
        values: [false, false, true],
      },
      {
        label: "Per-tenant LLM metering",
        values: [false, false, true],
      },
      {
        label: "Audit log",
        values: [
          { kind: "dash" },
          { kind: "text", value: "30 days" },
          { kind: "text", value: "Unlimited + export" },
        ],
      },
    ],
  },
  {
    name: "Security & compliance",
    description: "What's enforced vs what's available as add-on.",
    rows: [
      {
        label: "Row-level security + encryption at rest",
        values: [true, true, true],
      },
      {
        label: "Secrets management",
        hint: "Per-tenant secrets via Doppler / Vault-compatible providers.",
        values: [true, true, true],
      },
      {
        label: "SOC 2 documentation pack",
        values: [
          false,
          {
            kind: "tooltip",
            value: "Add-on",
            hint: "Available as a $299 add-on with the Pro tier.",
          },
          true,
        ],
      },
      {
        label: "SSO (SAML + OIDC)",
        values: [
          { kind: "dash" },
          {
            kind: "tooltip",
            value: "Q3 2026",
            hint: "Ships in the Pro tier once the Q3 2026 release lands.",
          },
          {
            kind: "tooltip",
            value: "Q3 2026",
            hint: "Ships in the Team tier once the Q3 2026 release lands.",
          },
        ],
      },
    ],
  },
  {
    name: "Integrations & content",
    description: "Pre-wired third parties and content infrastructure.",
    rows: [
      {
        label: "Email (Resend + React Email)",
        values: [false, true, true],
      },
      {
        label: "Blog + content hub (MDX)",
        values: [false, true, true],
      },
      {
        label: "Docs site (Fumadocs)",
        hint: "Full-text search, MDX, AI-assisted actions.",
        values: [true, true, true],
      },
      {
        label: "i18n (multi-language)",
        values: [false, true, true],
      },
      {
        label: "GitHub / GitLab webhooks",
        values: [true, true, true],
      },
      {
        label: "LLM tokens / month",
        values: [
          { kind: "text", value: "100K" },
          { kind: "text", value: "1M" },
          { kind: "text", value: "Unlimited (your keys)" },
        ],
      },
    ],
  },
  {
    name: "Support & success",
    description: "How we have your back after you ship.",
    rows: [
      {
        label: "Lifetime updates",
        values: [true, true, true],
      },
      {
        label: "Community (Discord)",
        values: [
          { kind: "text", value: "Public" },
          { kind: "text", value: "Public" },
          { kind: "text", value: "Private" },
        ],
      },
      {
        label: "Email support",
        values: [
          {
            kind: "tooltip",
            value: "48h response",
            hint: "Best-effort response within 2 business days.",
          },
          {
            kind: "tooltip",
            value: "Priority",
            hint: "Target response within 4 business hours.",
          },
          {
            kind: "tooltip",
            value: "24h SLA",
            hint: "Guaranteed response within 24 hours, business days.",
          },
        ],
      },
      {
        label: "Onboarding session",
        values: [
          { kind: "dash" },
          { kind: "dash" },
          {
            kind: "tooltip",
            value: "60 min",
            hint: "One 60-minute video session with a founder.",
          },
        ],
      },
      {
        label: "End-to-end testing (Playwright)",
        values: [false, true, true],
      },
    ],
  },
]

/**
 * "Best value" badge label. Used by FeatureMatrix to label the Pro column.
 */
export const BEST_VALUE_LABEL = "Best value"