// audit-fix workflow — v1
// Audit a list of packages, fix divergences in a loop, no documents generated.
// Inputs via args.packages = ["better-auth", "drizzle-orm", ...]
// Invoke:  /audit-fix better-auth drizzle-orm zod

export const meta = {
  name: 'audit-fix',
  description: 'Audit packages in parallel with Explore agents, fix divergences with code-fixer subagents, re-audit, loop until clean. No reports — only commits. Each fix is one commit on main, reverted automatically on regression.',
  whenToUse: 'User wants senior-pattern audit + automatic fixing for the listed packages',
  phases: [
    { title: 'Setup',     detail: 'capture baseline HEAD + the package list' },
    { title: 'Audit',     detail: 'parallel Explore agents, one per package' },
    { title: 'Fix',       detail: 'parallel code-fixer subagents on CRITICAL/WARNING findings' },
    { title: 'Re-audit',  detail: 'verify each fix actually resolved its finding' },
    { title: 'Finalize',  detail: 'revert regressions, final summary in conversation only' },
  ],
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    package:           { type: 'string' },
    declared_version:  { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity:    { enum: ['CRITICAL', 'WARNING', 'SUGGESTION'] },
          file:        { type: 'string' },
          line:        { type: 'integer' },
          observed:    { type: 'string', description: 'Current pattern with snippet' },
          recommended: { type: 'string', description: 'Docs-recommended pattern' },
          why:         { type: 'string', description: 'Why this matters' },
          doc_ref:     { type: 'string', description: 'URL or section' },
        },
        required: ['severity', 'file', 'line', 'observed', 'recommended', 'why'],
      },
    },
  },
  required: ['package', 'findings'],
}

const FIX_SCHEMA = {
  type: 'object',
  properties: {
    status:         { enum: ['applied', 'reverted', 'stale_finding', 'skipped', 'failed'] },
    commit_sha:     { type: 'string' },
    files_changed:  { type: 'array', items: { type: 'string' } },
    tests_run:      { type: 'boolean' },
    tests_passed:   { type: 'boolean' },
    stale_reason:   { type: 'string' },
    notes:          { type: 'string' },
  },
  required: ['status', 'tests_run', 'tests_passed'],
}

const RE_AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    aligned: { type: 'boolean' },
    notes:   { type: 'string' },
  },
  required: ['aligned'],
}

// ─── Prompt templates ─────────────────────────────────────────────────────────

const AUDIT_PROMPT = (pkg) => `
You are auditing how this monorepo uses the \`${pkg}\` package.

## Task
For each usage site:
1. Open the file. Read the surrounding 50 lines for context.
2. Identify the *pattern* used (which API, which options, which lifecycle).
3. Note file path + line numbers.

Then fetch the package's official docs:
- Try https://www.npmjs.com/package/${pkg} (README), then the GitHub repo link from npm.
- WebFetch the README. Extract: recommended idioms, deprecated APIs, migration guides for the current major.
- If no public docs (private/forked package), read node_modules/${pkg}/README.md and the .d.ts files.
- If the package is a workspace package (path starts with @workspace/), read its src/ directly.

## Severity rubric
- **CRITICAL**: bug, runtime crash, deprecated API removed in current major, security issue, broken type
- **WARNING**: performance, type safety, error handling, deprecated API slated for removal
- **SUGGESTION**: idiomatic improvement, no functional impact (rare — usually skip these for the fix loop)

## Output (JSON only)
Return JSON matching the schema: { package, declared_version, findings: [...] }

If a package isn't installed or has zero usages, return { findings: [] } with declared_version = "not-installed" or "unused".

Keep total response under 400 lines. Be thorough on CRITICAL/WARNING; be parsimonious with SUGGESTION.
`

const FIX_PROMPT = (finding) => `
You are the **code-fixer** subagent. Apply the minimal change for ONE finding.

# Finding
${JSON.stringify(finding, null, 2)}

# Procedure (5 steps, in order)

1. **Locate**: read the cited file around the cited line. If reality doesn't match the finding, return status: "stale_finding" with stale_reason and STOP.

2. **Plan minimal diff**: smallest possible change. No refactor, no reformat, no "while you're in there" fixes.

3. **Apply** with Edit/Write. Stay within the cited file unless explicitly justified.

4. **Verify** from project root:
   - pnpm typecheck — must pass
   - pnpm lint — must pass
   - If file is in a package with a test script: pnpm test — must pass
   - If failures: git checkout -- <file> and return status: "reverted"

5. **Commit** if all checks pass:
   fix(audit/${finding.package}): <one-line summary>

   Cited: ${finding.file}:${finding.line}
   Ref: ${finding.doc_ref || 'docs'}

# Output (JSON only)
Return JSON matching the schema: { status, commit_sha, files_changed, tests_run, tests_passed, stale_reason?, notes? }

# Ground rules
- No new dependencies, no version bumps.
- One finding = one commit.
- Edits land on the current branch (no worktree isolation in v1).
- Smallest possible diff.
`

const RE_AUDIT_PROMPT = (finding, fix) => `
You are verifying that an audit fix actually resolved its finding.

# Original finding
${JSON.stringify(finding, null, 2)}

# Fix that was applied
- commit: ${fix.commit_sha || 'unknown'}
- files changed: ${(fix.files_changed || []).join(', ') || 'unknown'}

# Your job
Read the cited file (now at HEAD) and confirm:
1. The divergence described in the finding is genuinely resolved.
2. The fix didn't introduce regressions in surrounding code (same file).

# Output (JSON only)
{ aligned: bool, notes: string }
`

// ─── Script body ──────────────────────────────────────────────────────────────

const { packages = [] } = args || {}

if (!packages.length) {
  log('No packages provided.')
  log('Usage: /audit-fix <pkg1> <pkg2> ...')
  log('Example: /audit-fix better-auth drizzle-orm zod')
  return { status: 'no_packages', iterations: 0, fixesCommitted: 0, fixes: [] }
}

const MAX_ITERATIONS        = 3
const MAX_FIXES_PER_ITER    = 10
const SUGGESTION_CAP        = 3   // at most 3 SUGGESTION-level fixes per iteration
const BUDGET_FLOOR_TOKENS   = 50000

phase('Setup')
const baselineSha = String(await agent(
  `Run: git rev-parse HEAD. Reply with ONLY the SHA on a single line, nothing else.`,
  { agentType: 'general-purpose', phase: 'Capture baseline' }
)).trim()
log(`baseline HEAD : ${baselineSha}`)
log(`packages      : ${packages.join(', ')}`)
log(`max iter      : ${MAX_ITERATIONS}, max fixes/iter: ${MAX_FIXES_PER_ITER}`)

let iteration   = 0
let totalFixed  = 0
const allFixes  = []

while (iteration < MAX_ITERATIONS) {
  iteration++
  log(`\n── iteration ${iteration} ──`)

  if (budget.total && budget.remaining() < BUDGET_FLOOR_TOKENS) {
    log(`budget exhausted (${budget.remaining()} tok left), stopping`)
    break
  }

  // ─── AUDIT ────────────────────────────────────────────────────────────────
  phase(`Audit ${iteration}`)
  const auditResults = await parallel(
    packages.map((pkg) => () => agent(
      AUDIT_PROMPT(pkg),
      { schema: AUDIT_SCHEMA, agentType: 'Explore', phase: `Audit ${pkg}` }
    ).then((r) => r || null))
  )
  const cleanAudits   = auditResults.filter(Boolean)
  const allFindings   = cleanAudits.flatMap((a) => (a && a.findings) || [])
  const criticals     = allFindings.filter((f) => f.severity === 'CRITICAL')
  const warnings      = allFindings.filter((f) => f.severity === 'WARNING')
  const suggestions   = allFindings.filter((f) => f.severity === 'SUGGESTION')

  log(`found: ${allFindings.length} total — ${criticals.length}C / ${warnings.length}W / ${suggestions.length}S`)

  if (criticals.length === 0 && warnings.length === 0 && suggestions.length === 0) {
    log('no actionable findings — done')
    break
  }

  // ─── FIX ──────────────────────────────────────────────────────────────────
  phase(`Fix ${iteration}`)
  const toFix = [
    ...criticals,
    ...warnings,
    ...suggestions.slice(0, SUGGESTION_CAP),
  ].slice(0, MAX_FIXES_PER_ITER)

  log(`fixing ${toFix.length} finding(s)`)

  const fixJobs = toFix.map((finding) => ({
    finding,
    pkg: finding.package || 'unknown',
  }))

  const fixAttempts = await parallel(
    fixJobs.map(({ finding, pkg }) => () =>
      agent(
        FIX_PROMPT(finding),
        { schema: FIX_SCHEMA, agentType: 'code-fixer', phase: `Fix ${pkg}` }
      ).then((r) => ({ result: r || null, finding }))
    )
  )

  const successful  = fixAttempts.filter(({ result }) =>
    result && result.status === 'applied' && result.tests_passed && result.commit_sha
  )
  const staleOrFail = fixAttempts.filter(({ result }) =>
    !result || result.status !== 'applied' || !result.tests_passed || !result.commit_sha
  )

  log(`applied: ${successful.length}, skipped/failed/stale: ${staleOrFail.length}`)
  totalFixed += successful.length
  allFixes.push(...successful.map((s) => ({ ...s.result, _finding: s.finding })))

  // ─── RE-AUDIT (only on applied fixes) ────────────────────────────────────
  if (successful.length > 0) {
    phase(`Re-audit ${iteration}`)
    const verifications = await parallel(
      successful.map(({ finding, result }) => () =>
        agent(
          RE_AUDIT_PROMPT(finding, result),
          { schema: RE_AUDIT_SCHEMA, agentType: 'Explore', phase: `Verify ${finding.package || ''}` }
        ).then((r) => ({
          aligned: r ? !!r.aligned : false,
          notes:   r ? (r.notes || '') : 'no response',
          commit:  result.commit_sha,
          finding,
        }))
      )
    )

    const regressions = verifications.filter((v) => !v.aligned)
    log(`verify: ${verifications.length - regressions.length}/${verifications.length} aligned`)

    for (const reg of regressions) {
      log(`reverting ${reg.commit} — ${reg.notes.slice(0, 100)}`)
      await agent(
        `Run this exact command and report only the final output (success or error): git revert --no-edit ${reg.commit}`,
        { agentType: 'general-purpose', phase: 'Revert' }
      )
    }
  } else {
    log('no applied fixes this iteration — nothing to verify')
  }

  // If everything in this iteration was clean (only fixes that reverted),
  // the next audit will see the same problems — break to avoid the loop.
  if (successful.length === 0 && staleOrFail.length > 0) {
    log('no progress this iteration — stopping to avoid loop')
    break
  }
}

phase('Finalize')
log(`\ndone in ${iteration} iteration(s)`)
log(`total fixes committed: ${totalFixed}`)
log(`revert any commit with: git revert <sha>`)
log(`review all audit fixes with: git log --oneline --grep="fix(audit/"`)

return {
  iterations:     iteration,
  fixesCommitted: totalFixed,
  fixes:          allFixes.map((f) => ({
    package:     f._finding ? f._finding.package : null,
    file:        f._finding ? f._finding.file    : null,
    commit_sha:  f.commit_sha || null,
  })),
}
