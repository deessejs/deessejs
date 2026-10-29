---
name: create-pr
description: Create a GitHub pull request for a completed DeesseJS implementation branch. Use when the user asks to open a PR for an issue or pushed branch in this repository.
---

# Create a pull request

Open a reviewable pull request for completed work. This skill does not implement changes or merge pull requests.

## Workflow

1. **Gather context.** For an issue-driven request, read the issue title, description, labels, and relevant comments with `gh`. Read an approved implementation plan if one is available on the implementation branch. Use the issue and branch context to write the PR title and summary.

2. **Check for an existing PR.** Look for an open PR from this branch targeting `staging`, and for an open PR already associated with the issue. If one exists, report its URL and ask before editing it. Do not create a duplicate.

3. **Check the changeset requirement.** If the diff changes the published surface of `apps/cli/**`, confirm a `.changeset/*.md` file is present. If it is required but missing, stop and ask for the bump type and consumer-facing summary before creating the PR. Other changes do not need a changeset. Follow `CONTRIBUTING.md` and `.changeset/README.md`.

4. **Prepare the PR body.** Follow `.github/PULL_REQUEST_TEMPLATE.md` when available. Keep the implementation diff focused and minimal, but take the time to explain the problem, rationale, behavior, important tradeoffs, and verification clearly, even when the diff is small. Leave checks unchecked unless they have passed. Do not add separate "Related issue" or "Type of change" sections: track issue relationships and change classification as GitHub metadata.

   Use fenced code blocks for concrete examples that make the change easier to understand, such as commands, API requests, configuration, or before/after behavior. Add a `mermaid` fenced block when a non-trivial flow or architecture benefits from a diagram. Use GitHub Markdown callouts such as `> [!NOTE]`, `> [!WARNING]`, or `> [!IMPORTANT]` for key caveats or decisions. Keep all three purposeful, and omit them when they do not clarify the PR. GitHub renders [Mermaid diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) and [Markdown alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts) in pull request descriptions.

5. **Create the PR against `staging`.** Use `gh pr create --base staging`. Never target `main` and never merge the PR.

6. **Link the issue in Development.** For an issue-driven PR, use GitHub GraphQL's `addCloseIssueReferences` mutation to link the PR to the issue. Get the issue and PR node IDs with:

   ```bash
   gh api graphql -F owner=deessejs -F name=deessejs -F issueNumber="$ISSUE_NUMBER" -F prNumber="$PR_NUMBER" -f query='query($owner: String!, $name: String!, $issueNumber: Int!, $prNumber: Int!) { repository(owner: $owner, name: $name) { issue(number: $issueNumber) { id } pullRequest(number: $prNumber) { id } } }'
   ```

   Read `.data.repository.issue.id` and `.data.repository.pullRequest.id` from the response as `ISSUE_ID` and `PR_ID`, then call:

   ```bash
   gh api graphql -F issueId="$ISSUE_ID" -F "pullRequestIds[]=$PR_ID" -f query='mutation($issueId: ID!, $pullRequestIds: [ID!]!) { addCloseIssueReferences(input: {issueId: $issueId, pullRequestIds: $pullRequestIds}) { issue { number } } }'
   ```

   Verify the mutation succeeds before reporting the issue linked. The `Closes #N` body keyword does not create a link for this repo's PRs to `staging`, because GitHub only interprets closing keywords when the PR targets the default branch. A manual Development link is visible on the issue; a PR merged to `staging` does not itself close the issue.

7. **Apply the right labels to the PR.** Inspect the issue and diff, then compare relevant issue labels against labels that currently exist in the repository:

   ```bash
   gh api repos/deessejs/deessejs/issues/$ISSUE_NUMBER --jq '[.labels[].name]'
   gh api --paginate repos/deessejs/deessejs/labels --jq '.[].name'
   ```

   Apply only labels that accurately describe the PR, such as an applicable `area:*`, `bug`, `enhancement`, `documentation`, `dependencies`, `security`, or `template` label. Never copy `status:*` or issue priority labels onto the PR, and never invent labels. Add the selected labels to the PR with GitHub CLI's REST API command:

   ```bash
   gh api --method POST repos/deessejs/deessejs/issues/$PR_NUMBER/labels -f 'labels[]=area:auth' -f 'labels[]=bug'
   ```

   Replace the example labels with the exact existing labels selected for this PR. If no labels apply, add none. Report which labels were applied.

8. **Report the result.** Give the PR URL, confirm its base is `staging`, report whether the Development link and labels were applied, and state which verification commands were run or skipped.

## Boundaries

- Opening the PR authorizes creating the PR and linking the requested issue. Do not assign people, change issue status labels, or post issue comments unless the user asks.
- Do not claim tests or checks passed unless you have evidence from this run or the relevant CI results.
- If the base branch, source branch, issue, or PR state is ambiguous, inspect the repository and GitHub state first. Ask only if the ambiguity affects which PR to create or update.
