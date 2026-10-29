---
name: create-pr
description: Create a GitHub pull request for a completed DeesseJS implementation branch. Use when the user asks to open a PR for an issue or pushed branch in this repository.
---

# Create a pull request

Open a reviewable pull request for completed work. This skill does not implement changes or merge pull requests.

## Workflow

1. **Gather context.** For an issue-driven request, read the issue title, description, labels, and relevant comments with `gh`. Read an approved implementation plan if one is available on the implementation branch. Use the issue and branch context to write the PR title and summary.

2. **Check the branch.** Confirm the implementation is committed and the branch is pushed to `origin`. Use the existing implementation branch, normally `impl/{n}-{slug}`. Do not reset, delete, or recreate it. Do not create the PR if the working tree contains uncommitted implementation changes; report what needs committing first.

3. **Check for an existing PR.** Look for an open PR from this branch targeting `staging`, and for an open PR already associated with the issue. If one exists, report its URL and ask before editing it. Do not create a duplicate.

4. **Check the changeset requirement.** If the diff changes the published surface of `apps/cli/**`, confirm a `.changeset/*.md` file is present. If it is required but missing, stop and ask for the bump type and consumer-facing summary before creating the PR. Other changes do not need a changeset. Follow `CONTRIBUTING.md` and `.changeset/README.md`.

5. **Prepare the PR body.** Follow `.github/PULL_REQUEST_TEMPLATE.md` when available. Include a concise summary, relevant changed areas, and verification that was actually performed. Leave checks unchecked unless they have passed. Do not add separate "Related issue" or "Type of change" sections: track issue relationships and change classification as GitHub metadata.

6. **Create the PR against `staging`.** Use `gh pr create --base staging`. Never target `main` and never merge the PR.

7. **Link the issue.** For an issue-driven PR, create a manual linked closing reference with GitHub's GraphQL `addCloseIssueReferences` mutation, using the issue and pull request node IDs. The PR targets `staging`, so do not rely on `Closes #N` in the body: GitHub only interprets closing keywords for PRs targeting the default branch. If the API link cannot be created, report that a maintainer can link it from the PR's **Development** section. Do not claim the issue is linked unless the API confirms it.

8. **Apply labels.** Apply only existing, relevant classification or area labels to the PR. Do not copy `status:*` workflow labels from the issue. Do not invent labels.

9. **Report the result.** Give the PR URL, confirm its base is `staging`, report whether the issue link and labels were applied, and state which verification commands were run or skipped.

## Boundaries

- Opening the PR authorizes creating the PR and linking the requested issue. Do not assign people, change issue status labels, or post issue comments unless the user asks.
- Do not claim tests or checks passed unless you have evidence from this run or the relevant CI results.
- If the base branch, source branch, issue, or PR state is ambiguous, inspect the repository and GitHub state first. Ask only if the ambiguity affects which PR to create or update.
