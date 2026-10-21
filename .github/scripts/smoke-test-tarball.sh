#!/usr/bin/env bash
#
# Install a packed tarball into a clean project and run the binaries it ships.
#
# Usage: smoke-test-tarball.sh <package-dir> <tarball>
#
# Why a real install and not `npm install --dry-run`
# -------------------------------------------------
# `--dry-run` reports what npm would do without installing anything. A `--help`
# after it exercises nothing: there is no installed package to run. This is the
# sequence a user actually performs with `npx`, so it is the sequence that has
# to work.
#
# This is also the gate that would have caught `create-deesse-app` declaring
# `cross-spawn: "catalog:"` as a runtime dependency, which ships as an
# unresolvable manifest and fails on the consumer's machine.
set -euo pipefail

PKG_DIR="${1:-}"
TARBALL="${2:-}"
if [ -z "$PKG_DIR" ] || [ -z "$TARBALL" ]; then
	echo "usage: $(basename "$0") <package-dir> <tarball>" >&2
	exit 2
fi

NAME=$(node -e "process.stdout.write(String(require('./$PKG_DIR/package.json').name || ''))")
[ -n "$NAME" ] || {
	echo "::error::Cannot read a name from $PKG_DIR/package.json"
	exit 1
}

case "$TARBALL" in
/* | [A-Za-z]:\\* | [A-Za-z]:/*) TAR_ABS="$TARBALL" ;;
*) TAR_ABS="$(pwd)/$TARBALL" ;;
esac
[ -f "$TAR_ABS" ] || {
	echo "::error::Tarball not found: $TAR_ABS"
	exit 1
}

SCRATCH=$(mktemp -d)
trap 'rm -rf "$SCRATCH"' EXIT

echo "Installing $NAME into a clean project at $SCRATCH"
cd "$SCRATCH"
npm init -y >/dev/null

# --loglevel=info surfaces the actual `npm error` block, which the default
# debug level keeps at silly/verbose where GitHub's log truncation clips it.
if ! npm install --loglevel=info --foreground-scripts "$TAR_ABS"; then
	echo "::error::npm install of $NAME failed."
	DEBUG_LOG=$(ls -t "$HOME"/.npm/_logs/*-debug-0.log 2>/dev/null | head -1 || true)
	if [ -n "$DEBUG_LOG" ]; then
		echo "::group::npm debug log"
		cat "$DEBUG_LOG"
		echo "::endgroup::"
		# Copy it somewhere the workflow can upload. The in-log `cat` alone
		# is not enough: the trace sits at debug level and GitHub truncates.
		if [ -n "${GITHUB_WORKSPACE:-}" ]; then
			SAFE_NAME=$(printf '%s' "$NAME" | tr -c 'A-Za-z0-9' '-')
			cp "$DEBUG_LOG" "$GITHUB_WORKSPACE/npm-debug-$SAFE_NAME.log" || true
		fi
	fi
	exit 1
fi

# Resolve the installed manifest rather than the repository one: the point is
# to exercise what npm actually wrote into node_modules.
INSTALLED=$(node -e '
  const fs = require("node:fs")
  const path = require("node:path")
  const name = process.argv[1]
  const dir = path.join("node_modules", ...name.split("/"))
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"))
  const bins = typeof pkg.bin === "string" ? { [pkg.name]: pkg.bin } : (pkg.bin || {})
  process.stdout.write(Object.keys(bins).join("\n"))
' "$NAME")

if [ -z "$INSTALLED" ]; then
	echo "::error::$NAME ships no bin. A published initializer must be executable."
	exit 1
fi

STATUS=0
while IFS= read -r bin_name; do
	[ -z "$bin_name" ] && continue
	BIN="node_modules/.bin/$bin_name"
	if [ ! -e "$BIN" ]; then
		echo "::error::$NAME declares bin '$bin_name' but npm did not create $BIN"
		STATUS=1
		continue
	fi
	echo "Running $BIN --help"
	# `--help` is the only invocation every one of these binaries supports
	# without touching the network, a package registry, or the filesystem.
	if ! "./$BIN" --help; then
		echo "::error::$bin_name --help exited non-zero"
		STATUS=1
	fi
done <<EOF
$INSTALLED
EOF

if [ "$STATUS" -eq 0 ]; then
	echo "Smoke test passed for $NAME"
fi
exit "$STATUS"