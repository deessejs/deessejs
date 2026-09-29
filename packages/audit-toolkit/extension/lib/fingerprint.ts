import { createHash } from "node:crypto"

/**
 * Audit-issue fingerprint.
 *
 * Inputs the (repository, category, normalised title, normalised impact,
 * sorted evidence paths). The hash is meant as an idempotency marker for
 * retries, not as a duplicate detector: two specialists that describe the
 * same defect with different wording will produce different fingerprints.
 * The duplicate check lives in createAuditIssue via search.
 */
export function computeFingerprint(input: {
  repository: string
  category: string
  title: string
  impact: string
  evidencePaths: string[]
}): string {
  const payload = JSON.stringify({
    repository: input.repository.toLowerCase(),
    category: input.category.toLowerCase(),
    title: input.title.trim().replace(/\s+/g, " ").slice(0, 160).toLowerCase(),
    impact: input.impact
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 400)
      .toLowerCase(),
    evidence: [
      ...new Set(input.evidencePaths.map((p) => p.toLowerCase())),
    ].sort(),
  })
  return createHash("sha256").update(payload).digest("hex")
}