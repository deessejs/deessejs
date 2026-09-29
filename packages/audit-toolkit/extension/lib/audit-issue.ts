import { z } from "zod"
import type { Octokit } from "@octokit/rest"

import { computeFingerprint } from "./fingerprint.js"

export const CreateAuditIssueInput = z.object({
  repository: z.string().regex(/^[^/]+\/[^/]+$/),
  mainSha: z.string().regex(/^[0-9a-f]{7,40}$/),
  category: z.string().min(1),
  title: z.string().min(8).max(120),
  impact: z.string().min(20),
  evidence: z
    .array(
      z.object({
        path: z.string().min(1),
        line: z.number().int().positive().optional(),
        explanation: z.string().min(10),
      }),
    )
    .min(1),
  verification: z.string().min(20),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
})

export type CreateAuditIssueInput = z.infer<typeof CreateAuditIssueInput>

export type AuditIssueOutcome =
  | {
      status: "created"
      url: string
      number: number
      fingerprint: string
    }
  | {
      status: "already-tracked"
      url: string
      number: number
      fingerprint: string
    }
  | { status: "rejected"; reason: string }

const FINGERPRINT_MARKER = (fp: string): string =>
  `<!-- deessejs-audit:fingerprint=${fp} -->`

export function buildIssueBody(
  input: CreateAuditIssueInput,
  fingerprint: string,
): string {
  return [
    "## Problem",
    input.title,
    "",
    input.impact,
    "",
    "## Evidence",
    ...input.evidence.map((e) => {
      const lineRef = e.line ? `:${e.line}` : ""
      return `- \`${e.path}${lineRef}\` at main commit \`${input.mainSha.slice(0, 7)}\` — ${e.explanation}`
    }),
    "",
    "## How to verify",
    input.verification,
    "",
    "## Acceptance criteria",
    ...input.acceptanceCriteria.map((c) => `- [ ] ${c}`),
    "",
    FINGERPRINT_MARKER(fingerprint),
  ].join("\n")
}

export async function createAuditIssue(
  input: CreateAuditIssueInput,
  octokit: Octokit,
): Promise<AuditIssueOutcome> {
  const parsed = CreateAuditIssueInput.safeParse(input)
  if (!parsed.success) {
    return { status: "rejected", reason: parsed.error.message }
  }
  const [owner, repo] = parsed.data.repository.split("/")
  if (!owner || !repo) {
    return { status: "rejected", reason: "repository must be owner/name" }
  }

  const fingerprint = computeFingerprint({
    repository: parsed.data.repository,
    category: parsed.data.category,
    title: parsed.data.title,
    impact: parsed.data.impact,
    evidencePaths: parsed.data.evidence.map((e) => e.path),
  })

  // Idempotency check #1: marker search across the whole repo (open + closed).
  const byMarker = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} deessejs-audit:fingerprint=${fingerprint}`,
    per_page: 1,
  })
  const markerHit = byMarker.data.items[0]
  if (markerHit) {
    return {
      status: "already-tracked",
      url: markerHit.html_url,
      number: markerHit.number,
      fingerprint,
    }
  }

  // Idempotency check #2: exact-title match on open issues.
  const byTitle = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:issue in:title "${encodedTitle(parsed.data.title)}"`,
    per_page: 5,
  })
  const titleHit = byTitle.data.items.find(
    (i) => i.title.toLowerCase() === parsed.data.title.toLowerCase(),
  )
  if (titleHit) {
    return {
      status: "already-tracked",
      url: titleHit.html_url,
      number: titleHit.number,
      fingerprint,
    }
  }

  // Idempotency check #3: an open PR with the same title may already be
  // closing this defect.
  const byOpenPR = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:pr is:open "${encodedTitle(parsed.data.title)}"`,
    per_page: 5,
  })
  const prHit = byOpenPR.data.items.find(
    (p) => p.title.toLowerCase() === parsed.data.title.toLowerCase(),
  )
  if (prHit) {
    return {
      status: "already-tracked",
      url: prHit.html_url,
      number: prHit.number,
      fingerprint,
    }
  }

  const body = buildIssueBody(parsed.data, fingerprint)
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title: parsed.data.title,
    body,
    labels: ["audit", `category:${parsed.data.category}`],
  })
  return {
    status: "created",
    url: data.html_url,
    number: data.number,
    fingerprint,
  }
}

function encodedTitle(title: string): string {
  return title.replace(/"/g, '\\"')
}