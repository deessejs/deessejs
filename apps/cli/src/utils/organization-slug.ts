import { createHash } from "node:crypto"

const SLUG_MAX_LENGTH = 38

const fallbackSlug = (name: string): string => {
  const digest = createHash("sha256").update(name).digest("hex").slice(0, 8)
  return `org-${digest}`
}

/** Propose a valid base slug. The server validates it and resolves conflicts. */
export function organizationSlugFromName(name: string): string {
  const runs = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((run) => run !== "")

  const base = runs.join("-").slice(0, SLUG_MAX_LENGTH).replace(/-$/, "")
  return base.length >= 2 ? base : fallbackSlug(name)
}
