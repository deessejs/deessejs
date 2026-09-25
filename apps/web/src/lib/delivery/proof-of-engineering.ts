/**
 * Standards every /delivery engagement is held to.
 *
 * The list mirrors the production-grade expectations of the Pro
 * templates the team ships. Zod schemas end-to-end, OTel
 * defaults, multi-tenant isolation. Buyers can verify each
 * against any repository we have shipped.
 */
export type ProofItem = {
  label: string
  detail: string
}

export const PROOF_OF_ENGINEERING: ReadonlyArray<ProofItem> = [
  {
    label: "Strict TypeScript",
    detail: "No `any`, Zod schemas end-to-end at every I/O boundary.",
  },
  {
    label: "Tests & CI/CD",
    detail: "GitHub Actions configured for production from day one.",
  },
  {
    label: "Database migrations",
    detail: "Schemas documented, Drizzle / Prisma migrations managed.",
  },
  {
    label: "Security",
    detail: "Dependency audits, CSRF protection, multi-tenant isolation.",
  },
  {
    label: "Observability",
    detail: "OpenTelemetry by default, vendor-agnostic.",
  },
  {
    label: "Documentation",
    detail: "README + per-template KB article + inline AGENTS.md.",
  },
]
