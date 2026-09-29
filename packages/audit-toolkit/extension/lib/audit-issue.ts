import { z } from "zod"

import type { InstallationOctokit } from "./octokit-app.js"
import { computeFingerprint } from "./fingerprint.js"
import { readRepositoryAllowlist } from "./env.js"

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
        line: z.number().int().optional(),
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

/**
 * Repository allowlist enforcement. See ./env.ts for the precedence
 * between AUDIT_TARGET_REPOSITORIES (CSV, M3) and AUDIT_TARGET_REPOSITORY
 * (M1).
 */
function assertRepositoryAllowed(repository: string): void {
  const allow = readRepositoryAllowlist()
  if (allow.length === 0) {
    throw new Error(
      "createAuditIssue refused: no AUDIT_TARGET_REPOSITORIES or " +
        "AUDIT_TARGET_REPOSITORY is set in the deployment environment, " +
        "so the allowlist is empty and no publication is permitted.",
    )
  }
  if (!allow.includes(repository.toLowerCase())) {
    throw new Error(
      `createAuditIssue refused: '${repository}' is not in the audit ` +
        `allowlist (${allow.join(", ")}).`,
    )
  }
}

/**
 * Publication must come from the scheduled audit, not from a mention-loop
 * conversation. Schedules authenticate the runtime as the app principal
 * (see eve/schedules doc — ScheduleHandlerArgs.appAuth has
 * authenticator: "app", principalType: "runtime"). GitHub channels
 * authenticate the commenting user. We accept only the former.
 *
 * `ctx.session.auth.initiator` is the principal who created the session,
 * which is the schedule's app principal for audit runs and the GitHub
 * user for mention-loop sessions. A hostile mention prompt that tries to
 * drive the root agent into dispatching the behaviour specialist cannot
 * forge this — the channel layer derives auth from the verified webhook
 * signature, never from body fields.
 */
function assertAuditOrigin(ctx: {
  session: { auth: { initiator: unknown } }
}): void {
  const initiator = ctx.session.auth.initiator as
    | {
        authenticator?: string
        principalType?: string
      }
    | null
  if (
    !initiator ||
    initiator.authenticator !== "app" ||
    initiator.principalType !== "runtime"
  ) {
    throw new Error(
      "createAuditIssue refused: caller is not an audit run. " +
        "Publication is only allowed from the scheduled nightly audit " +
        "session, whose initiator authenticator is 'app' with " +
        "'principalType: \"runtime\"'.",
    )
  }
}

export async function createAuditIssue(
  input: CreateAuditIssueInput,
  octokit: InstallationOctokit,
  ctx: {
    session: { auth: { initiator: unknown } }
  },
): Promise<AuditIssueOutcome> {
  const parsed = CreateAuditIssueInput.safeParse(input)
  if (!parsed.success) {
    return { status: "rejected", reason: parsed.error.message }
  }
  const [owner, repo] = parsed.data.repository.split("/")
  if (!owner || !repo) {
    return { status: "rejected", reason: "repository must be owner/name" }
  }

  try {
    assertAuditOrigin(ctx)
    assertRepositoryAllowed(parsed.data.repository)
  } catch (error) {
    return {
      status: "rejected",
      reason: error instanceof Error ? error.message : String(error),
    }
  }

  const fingerprint = computeFingerprint({
    repository: parsed.data.repository,
    category: parsed.data.category,
    title: parsed.data.title,
    impact: parsed.data.impact,
    evidencePaths: parsed.data.evidence.map((e) => e.path),
  })

  // Idempotency check #1: marker search restricted to OPEN issues and
  // PRs. A closed issue that previously carried the marker must not block a
  // fresh report — the defect may have reappeared.
  const byMarker = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:open deessejs-audit:fingerprint=${fingerprint}`,
    per_page: 1,
  })
  const markerHit = byMarker.data.items[0] as
    | { html_url?: string; number?: number }
    | undefined
  if (markerHit && markerHit.html_url && typeof markerHit.number === "number") {
    return {
      status: "already-tracked",
      url: markerHit.html_url,
      number: markerHit.number,
      fingerprint,
    }
  }

  // Idempotency check #2: exact-title match on OPEN issues. Closed issues
  // with the same title do not block — the regression is new.
  const byTitle = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:issue is:open in:title "${encodedTitle(parsed.data.title)}"`,
    per_page: 5,
  })
  const titleHit = byTitle.data.items
    .map((i: { title?: string; html_url?: string; number?: number }) => i)
    .find(
      (i) =>
        typeof i.title === "string" &&
        i.title.toLowerCase() === parsed.data.title.toLowerCase(),
    )
  if (titleHit && titleHit.html_url && typeof titleHit.number === "number") {
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
  const prHit = byOpenPR.data.items
    .map((p: { title?: string; html_url?: string; number?: number }) => p)
    .find(
      (p) =>
        typeof p.title === "string" &&
        p.title.toLowerCase() === parsed.data.title.toLowerCase(),
    )
  if (prHit && prHit.html_url && typeof prHit.number === "number") {
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