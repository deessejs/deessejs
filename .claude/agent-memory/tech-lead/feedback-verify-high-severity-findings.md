---
name: feedback-verify-high-severity-findings
description: Before calling a code-audit finding P0 or P1, verify the exact dependency version, runtime path, repository exposure, and relevant upstream behavior with primary sources
metadata:
  type: feedback
---

Do not assign P0 or P1 from static plausibility alone. Verify the exact installed version from the lockfile, trace the real runtime or bundler path, inspect Git history when exposure is claimed, and confirm framework or dependency behavior with primary upstream sources through `fresh`.

**Why:** On 2026-07-13, an initial audit overclassified several findings: it treated a Node ESM `require()` defect as a guaranteed Next.js crash without accounting for Turbopack, called an ignored `.env` committed without checking Git objects, overstated what `BETTER_AUTH_SECRET` alone can forge, and confused the legacy CLI version with the runtime version. The user explicitly asked for deeper self-directed verification and challenged the incorrect claims. The same lesson applied during the P1 sweep: the OAuth provider wiring (P1-006) needed separate verification from the OAuthButtons duplication (P1-007), and the catalog `latest` issue (P1-005) needed cross-checking against the resolved lockfile versions.

**How to apply:** For each high-severity finding, record facts, assumptions, and untested behavior separately. Use `P0` only when the impact and active execution path are both confirmed, or label it a release gate that still needs an isolated runtime test. Correct prior reports directly when new evidence changes severity. Prefer `fresh search` and `fresh fetch`; do not use workflow/deep-research when the user asks for a solo investigation.

For the P1 sweep, the working pattern was:

1. `TaskCreate` for each investigation → doc → memory cycle.
2. Open the exact file or files the issue names.
3. `grep`/`Read` for the symptom and any related code paths.
4. Fetch upstream source/docs for the version actually installed (lockfile-resolved, not catalog-declared).
5. Write the issue doc with `P1`, accepted verdict, evidence file paths, upstream citations, acceptance criteria, safe verification procedure.
6. Add a project-type memory that future sessions can find without re-running the investigation.

Related: [[user.md|user-style]], [[packages/ui-audit.md|packages-ui-audit]], [[better-auth-cli-release-blocker]], [[p1-settings-cosmetic-stubs]].
