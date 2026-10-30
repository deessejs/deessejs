---
name: triage
description: Triage a GitHub issue in the DeesseJS repository by checking its completeness, classification, and labels. Apply labels and post a concise review only when the user asks for triage; issue analysis or review requests remain read-only.
---

# Triage a GitHub issue

Use this skill for issues in `deessejs/deessejs`. Review the issue against the repository's current issue forms and label taxonomy, then either report findings or perform the requested triage.

## Choose the requested mode

- **Analyze/review:** fetch the issue and report its type, missing information, likely area, blockers, and suggested labels. Do not change labels, comment, assign, or close it.
- **Triage/label:** after fetching and assessing it, apply only justified labels and post a short public triage comment when useful. Do not assign, close, or otherwise change the issue unless asked.

Use the GitHub tools available in this session. If they cannot perform the needed operation, use an authenticated `gh` CLI. Confirm the repository is `deessejs/deessejs` and inspect the issue's current labels before making changes. Verify proposed label names against the repository's live label list; do not create labels.

## Assess the issue

Read its title, body, state, author, labels, and relevant comments. Use the issue templates in `.github/ISSUE_TEMPLATE/` as the source for required fields:

- **Bug:** description, reproduction steps, and affected area are required. Expected and actual behavior, logs, and environment details help diagnosis.
- **Feature:** summary, detailed description, and affected area are required. Motivation, alternatives, and acceptance criteria help assess it.
- **Add template:** check slug, public GitHub repository, category, license, description, and 3–4 technical labels. Treat this as a proposal for maintainer review; the form does not itself create a pull request.
- **Other:** check that the request and desired outcome are clear enough to act on.

The bug and feature `area` dropdowns are issue-body fields, not GitHub labels. Infer the corresponding `area:*` label from the selected value or issue content, then add it only if that label exists and is missing. Use the current issue forms and live repository labels instead of assuming this list is complete; the templates may lag behind the monorepo's workspaces.

Check for duplicate reports and explicit dependencies. Distinguish missing information from uncertainty: ask for information only when it is needed to reproduce, scope, or decide the issue. Do not infer priority from issue type alone; recommend a priority only when impact and urgency support it.

## Security and sensitive content

The repository's `security.yml` is a public issue form. Do not tell reporters that its contents are private, and do not repeat exploit details, credentials, or personal information in a public comment. If an issue appears to disclose a vulnerability or secret, report that privately to the user or maintainer and point to the repository's configured private reporting channel. Do not post sensitive details or attempt to move, close, or redact the issue unless the user explicitly asks and the available tool supports it.

## Apply triage labels

Use only labels confirmed to exist in the repository. Preserve existing labels unless the user asks to change them. Common label groups include:

- Type: `bug`, `enhancement`, `documentation`, `question`, and GitHub's other standard labels.
- Area: `area:*`, mapped to the affected workspace or concern.
- Status: `status:needs-triage`, `status:ready`, `status:in-progress`, `status:blocked`, or `needs-info`.
- Priority: `priority:high`, `priority:medium`, or `priority:low`.
- Cross-cutting: for example, `breaking-change`, `dependencies`, or `github_actions`.

Recommended status decisions:

- `needs-info` when required details are missing and prevent useful assessment.
- `status:blocked` only when a concrete dependency prevents progress; identify it in the comment.
- `status:ready` when the issue is sufficiently clear, actionable, and unblocked.
- Keep `status:in-progress` when work is already underway.

Do not label an issue `duplicate`, `invalid`, or `wontfix` based only on a hunch. If closure is warranted, explain why and get explicit user direction before closing it.

## Comment

For a mutating triage, post a brief comment with the issue type, area, status, and decision. Include priority only when supported. For `needs-info`, list the specific missing details. For `status:blocked`, link the blocking issue or dependency. Keep comments factual, respectful, and free of sensitive details. Do not post a comment for review-only requests unless asked.

After changes, summarize the labels added and the comment posted. If no changes were justified, say why.
