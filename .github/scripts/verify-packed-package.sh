#!/usr/bin/env bash
#
# Pack a workspace package and assert the tarball is publishable.
#
# Usage: verify-packed-package.sh <package-dir>
# On success it prints the tarball path to stdout and exits 0.
#
# Why `pnpm pack` and not `npm pack`: both public packages declare pnpm-only
# protocol specifiers (`catalog:`, `workspace:*`). `pnpm pack` resolves them
# into concrete version ranges before packing. `npm pack` ships them literally
# and a consumer on plain npm fails with EUNSUPPORTEDPROTOCOL.
#
# The reverse trap also matters, and it is silent: `npm pack` drops the
# `"../../LICENSE"` entry both manifests carry in `files`, because npm does not
# pack paths outside the package directory. `pnpm pack` does include it. A MIT
# package that ships without its license is a real defect, and switching packers
# would reintroduce it without any error. The `LICENSE` assertion below is what
# makes the packer choice visible instead of implicit.
#
# Both the PR-time verify gate and the release workflow call this script, so the
# property proven here is exactly the one the release depends on.
set -euo pipefail

PKG_DIR="${1:-}"
if [ -z "$PKG_DIR" ]; then
	echo "usage: $(basename "$0") <package-dir>" >&2
	exit 2
fi
if [ ! -f "$PKG_DIR/package.json" ]; then
	echo "::error::No package.json found under $PKG_DIR"
	exit 1
fi

NAME=$(node -e "process.stdout.write(String(require('./$PKG_DIR/package.json').name || ''))")
if [ -z "$NAME" ]; then
	echo "::error::$PKG_DIR/package.json has no name"
	exit 1
fi

# Remove tarballs from a previous run so the glob below cannot pick up a stale
# file and validate the wrong bytes.
rm -f "$PKG_DIR"/*.tgz
pnpm --dir "$PKG_DIR" pack >/dev/null

TARBALL=$(ls "$PKG_DIR"/*.tgz 2>/dev/null | head -1)
if [ -z "$TARBALL" ]; then
	echo "::error::pnpm pack produced no tarball for $NAME"
	exit 1
fi
TB_NAME=$(basename "$TARBALL")

# `tar` is invoked from inside the package directory with a bare filename so
# that no Windows drive letter reaches the tar argument. A `C:\...` argument is
# parsed as a `host:path` remote spec by GNU tar and fails with
# "Cannot connect to C: resolve failed".
LIST=$(mktemp)
BINS=$(mktemp)
MANIFEST=$(mktemp)
trap 'rm -f "$LIST" "$BINS" "$MANIFEST"' EXIT
(cd "$PKG_DIR" && tar -tzf "$TB_NAME") >"$LIST"
(cd "$PKG_DIR" && tar -xzOf "$TB_NAME" package/package.json) >"$MANIFEST"

# Required files.
#
# The list is read from a temp file rather than a pipe: `grep -q` closes stdin
# on first match, which sends SIGPIPE to `tar`, and under `set -o pipefail` that
# would mask a successful match as a failure.
for required in package/package.json package/README.md package/LICENSE; do
	if ! grep -qxF "$required" "$LIST"; then
		echo "::error::$NAME tarball is missing $required"
		echo "::error::Packed contents were:"
		sed 's/^/::error::  /' "$LIST"
		exit 1
	fi
done

# Every declared `bin` target must be present. This replaces a hardcoded
# `package/dist/index.js` check: if a future package ships its entry point
# somewhere other than dist/, the gate follows the manifest instead of the
# other way round.
node -e '
  const p = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  const bins = typeof p.bin === "string" ? { [p.name]: p.bin } : (p.bin || {})
  process.stdout.write(Object.values(bins).join("\n"))
' "$MANIFEST" >"$BINS"

while IFS= read -r bin_path; do
	[ -z "$bin_path" ] && continue
	normalised="${bin_path#./}"
	if ! grep -qxF "package/$normalised" "$LIST"; then
		echo "::error::$NAME declares bin '$bin_path' but the tarball has no package/$normalised"
		echo "::error::A published package whose bin is missing cannot be executed by npx."
		exit 1
	fi
done <"$BINS"

# The packaged manifest must not carry pnpm-only protocol specifiers. If a
# future change switches the pack command back to `npm pack`, this fails here
# instead of on a consumer's machine.
#
# `devDependencies` is scanned too because some packers ship them inside the
# packaged `package.json`; a leaked `workspace:` there is a publish-time defect
# even when no consumer installs it.
if ! node -e '
  const pkg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  const offenders = []
  const scan = (obj) => {
    if (!obj || typeof obj !== "object") return
    for (const [name, value] of Object.entries(obj)) {
      if (typeof value === "string" && (value === "catalog:" || value.startsWith("workspace:"))) {
        offenders.push(`${name} = ${JSON.stringify(value)}`)
      } else if (value && typeof value === "object") {
        scan(value)
      }
    }
  }
  scan(pkg.dependencies)
  scan(pkg.devDependencies)
  scan(pkg.peerDependencies)
  if (offenders.length) {
    for (const o of offenders) console.error("::error::  - " + o)
    process.exit(1)
  }
' "$MANIFEST"; then
	echo "::error::$NAME packaged manifest contains pnpm-only specifiers (catalog: / workspace:)."
	echo "::error::A consumer on plain npm would fail to install this tarball."
	exit 1
fi

echo "Verified $NAME -> $TB_NAME"
echo "$TARBALL"