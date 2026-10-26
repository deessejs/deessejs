#!/usr/bin/env bash
#
# Decide whether a pull request is the auto-generated Version Packages pull
# request, and therefore exempt from the changeset-presence gate.
#
# Usage:
#   is-version-package-pr.sh <base-sha> <head-sha> <head-repo> <repo> \
#                            <author-login> <expected-bot-login> <head-ref>
#
# Exit 0 = exempt. Exit 1 = not exempt. Every rejection prints one
# `::debug::` line naming the condition that failed.
#
# Why this is not a branch-name or title check
# --------------------------------------------
# Both of those are chosen by whoever opens the pull request. A contributor who
# named their branch `changeset-release/staging` and titled the pull request
# `Version Packages` would skip the gate while supplying no changeset, which is
# exactly what the gate exists to prevent.
#
# The identity conditions are therefore on the *author*, not on what the pull
# request calls itself. A pull request authored by a human always carries a
# `User` login, so conditions 1 and 2 cannot be satisfied by choosing a name.
# Conditions 3 and 4 are defence in depth for a leaked App token: even then, the
# pull request must change nothing beyond versions.
set -euo pipefail

BASE_SHA="${1:-}"
HEAD_SHA="${2:-}"
HEAD_REPO="${3:-}"
REPO="${4:-}"
AUTHOR_LOGIN="${5:-}"
EXPECTED_BOT_LOGIN="${6:-}"
HEAD_REF="${7:-}"

reject() {
	echo "::debug::version-packages exemption rejected: $1"
	exit 1
}

[ -n "$BASE_SHA" ] || reject "no base sha provided"
[ -n "$HEAD_SHA" ] || reject "no head sha provided"

# Condition 1: the branch lives in this repository, not a fork.
[ "$HEAD_REPO" = "$REPO" ] || reject "head repo is $HEAD_REPO, not $REPO"

# Condition 2: the pull request was opened by the release App. This is the
# condition that does the work.
[ -n "$EXPECTED_BOT_LOGIN" ] || reject "VERSION_PACKAGES_BOT_LOGIN is not configured on the repository"
[ "$AUTHOR_LOGIN" = "$EXPECTED_BOT_LOGIN" ] || reject "author is '$AUTHOR_LOGIN', expected '$EXPECTED_BOT_LOGIN'"

# Condition 3: the exact branch changesets/action derives for base `staging`.
[ "$HEAD_REF" = "changeset-release/staging" ] || reject "head ref is '$HEAD_REF', expected 'changeset-release/staging'"

# Condition 4: content. A path allowlist alone is not a constraint, because
# `package.json` and `pnpm-lock.yaml` can carry arbitrary edits inside an
# allowed path, so each allowed path has its own rule.
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

CHANGED=$(git diff --name-only "$BASE_SHA...$HEAD_SHA")
if [ -z "$CHANGED" ]; then
	reject "the pull request changes no files"
fi

DELETED=$(git diff --diff-filter=D --name-only "$BASE_SHA...$HEAD_SHA")

while IFS= read -r file; do
	[ -z "$file" ] && continue
	case "$file" in
	apps/*/package.json | packages/*/package.json)
		# Only the top-level `version` may differ. This is a structural
		# comparison of the two parsed manifests, not a pattern match over
		# the raw diff: a `"version"` line nested under another object
		# matches a line-level pattern while proving nothing about the
		# package's own field, and the diff's own `---`/`+++` headers match
		# no content pattern at all.
		git show "$BASE_SHA:$file" >"$TMPDIR/base.json"
		git show "$HEAD_SHA:$file" >"$TMPDIR/head.json"
		if ! node -e '
      const fs = require("node:fs")
      const [base, head] = process.argv.slice(1).map((p) => JSON.parse(fs.readFileSync(p, "utf8")))
      const before = base.version
      const after = head.version
      delete base.version
      delete head.version
      if (JSON.stringify(base) !== JSON.stringify(head)) {
        console.error(`::debug::${process.argv[4]}: manifest changed outside "version"`)
        process.exit(1)
      }
      if (before === after) {
        console.error(`::debug::${process.argv[4]}: version did not change`)
        process.exit(1)
      }
    ' "$TMPDIR/base.json" "$TMPDIR/head.json" "$file"; then
			reject "$file changes something other than its version field"
		fi
		;;
	.changeset/*.md)
		# Deletions only. A version pull request consumes changesets and
		# never adds or edits one. Checking against the deletion set rather
		# than "no additions" is deliberate: a *modified* changeset produces
		# no output from an additions-only filter and would slip through.
		if ! printf '%s\n' "$DELETED" | grep -qxF "$file"; then
			reject "$file is not a pure deletion under .changeset/"
		fi
		;;
	*/CHANGELOG.md | CHANGELOG.md)
		# changesets writes these wholesale.
		;;
	pnpm-lock.yaml)
		# Allowed without a content check, and the spec says so out loud.
		# A version bump legitimately rewrites the recorded versions of the
		# two package entries and their importers, so constraining this file
		# to a shape is not practical. The bound is that the exemption
		# skips *only* the changeset-presence gate: the pull request still
		# has to pass typecheck, lint, tests and the publish-verify matrix.
		;;
	*)
		reject "'$file' is outside the version-file allowlist"
		;;
	esac
done <<EOF
$CHANGED
EOF

echo "::debug::version-packages exemption granted"
exit 0