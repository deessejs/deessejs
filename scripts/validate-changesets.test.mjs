import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, test } from "node:test"

import { validateChangesets } from "./validate-changesets.mjs"

const temporaryRoots = []

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "changeset-validator-"))
  temporaryRoots.push(root)
  mkdirSync(join(root, ".changeset"))
  mkdirSync(join(root, "apps", "cli"), { recursive: true })
  mkdirSync(join(root, "packages", "internal"), { recursive: true })
  writeFileSync(
    join(root, "apps", "cli", "package.json"),
    JSON.stringify({ name: "@deessejs/cli" }),
  )
  writeFileSync(
    join(root, "packages", "internal", "package.json"),
    JSON.stringify({ name: "@workspace/internal", private: true }),
  )
  writeFileSync(join(root, ".changeset", "README.md"), "# Changesets\n")
  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

test("accepts quoted keys and ignores the changeset README", () => {
  const root = createFixture()
  writeFileSync(
    join(root, ".changeset", "small-birds-fly.md"),
    '---\n"@deessejs/cli": minor\n"@workspace/internal": patch\n---\n\nSummary.\n',
  )

  assert.deepEqual(validateChangesets(root).errors, [])
})

test("rejects an invalid bump for a public package", () => {
  const root = createFixture()
  writeFileSync(
    join(root, ".changeset", "invalid-bump.md"),
    '---\n"@deessejs/cli": huge\n---\n\nSummary.\n',
  )

  assert.match(validateChangesets(root).errors.join("\n"), /invalid bump/)
})

test("accepts a valid private package changeset", () => {
  const root = createFixture()
  writeFileSync(
    join(root, ".changeset", "private-only.md"),
    '---\n"@workspace/internal": patch\n---\n\nSummary.\n',
  )

  assert.deepEqual(validateChangesets(root).errors, [])
})


test("validates only changesets changed in the pull request", () => {
  const root = createFixture()
  writeFileSync(
    join(root, ".changeset", "valid-new.md"),
    '---\n"@deessejs/cli": patch\n---\n\nSummary.\n',
  )
  writeFileSync(
    join(root, ".changeset", "legacy-stale.md"),
    '---\n"@deessejs/removed-package": patch\n---\n\nSummary.\n',
  )

  assert.deepEqual(
    validateChangesets(root, [".changeset/valid-new.md"]).errors,
    [],
  )
})

test("rejects unknown packages and malformed frontmatter", () => {
  const root = createFixture()
  writeFileSync(
    join(root, ".changeset", "unknown-package.md"),
    '---\n"@deessejs/missing": patch\n---\n\nSummary.\n',
  )
  writeFileSync(join(root, ".changeset", "missing-frontmatter.md"), "No frontmatter.\n")

  assert.match(validateChangesets(root).errors.join("\n"), /unknown workspace package/)
  assert.match(validateChangesets(root).errors.join("\n"), /missing or malformed frontmatter/)
})
