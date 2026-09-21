/**
 * Canonical human-label maps for the templates registry.
 *
 * Single source of truth for "what slug maps to what display string" on
 * the categories and frameworks axes. Both apps/web (filter sidebar,
 * index page validation, marketing copy) and apps/cli (when present)
 * import from this module — keeping the human labels here means a new
 * template slug added in `templates.ts` shows up in the registry UI
 * without manual sync across files.
 *
 * Pure data module. No runtime imports beyond types. Importing this
 * file from a client component MUST NOT transitively drag
 * `@workspace/auth` → `@workspace/database` → `postgres` into the
 * browser bundle (Turbopack rejects node builtins). Verified safe:
 * the module imports only TypeScript types.
 *
 * Adding a new category or framework:
 *   1. Add the slug as a key below.
 *   2. Reference the slug from at least one entry in
 *      `./templates.ts` (`category` for categories, `labels` for frameworks).
 *   3. The filter sidebar hides frameworks that no template carries, so
 *      adding a key without a matching label entry will surface in the
 *      sidebar only after a template ships.
 */
export type CategorySlug = keyof typeof CATEGORY_LABELS
export type FrameworkSlug = keyof typeof FRAMEWORK_LABELS

/**
 * Categories — coarse surface grouping used by the registry index page
 * to filter templates (e.g. "SaaS starters", "AI", "Landing pages").
 *
 * The key is the slug written into `RegistryEntry.category`. The value
 * is the human-readable label rendered in the sidebar and metadata.
 */
export const CATEGORY_LABELS = {
  saas: "SaaS starters",
  ai: "AI",
  landing: "Landing pages",
} as const

/**
 * Frameworks — technical labels surfaced in the registry sidebar as
 * filter chips. The key is the slug that appears in `RegistryEntry.labels`.
 *
 * Themes like "auth" or "marketing" intentionally stay out of this map
 * — those are not frameworks. Adding one requires a slug reference in
 * `templates.ts` and a label here.
 */
export const FRAMEWORK_LABELS = {
  nextjs: "Next.js",
  astro: "Astro",
  tailwind: "Tailwind CSS",
  shadcn: "shadcn/ui",
  drizzle: "Drizzle",
  postgres: "Postgres",
  stripe: "Stripe",
  "tanstack-table": "TanStack Table",
  openai: "OpenAI",
  "react-hook-form": "React Hook Form",
} as const
