import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { shouldBuild } from "./vercel-ignore-build.mjs"

function fixture(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), "vercel-ignore-"))
  const run = (args) => {
    const result = spawnSync("/usr/bin/git", args, { cwd, encoding: "utf8" })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
  }
  run(["init", "-q"])
  run(["config", "user.name", "Fixture"])
  run(["config", "user.email", "fixture@example.invalid"])
  mkdirSync(path.join(cwd, "apps", "app"), { recursive: true })
  writeFileSync(path.join(cwd, "apps", "app", "app.ts"), "initial\n")
  run(["add", "."])
  run(["commit", "-qm", "initial"])
  const base = run(["rev-parse", "HEAD"])
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  return { cwd, base, run }
}

test("builds for affected task and safely skips an unrelated change", (t) => {
  const f = fixture(t)
  writeFileSync(path.join(f.cwd, "apps", "app", "app.ts"), "changed\n")
  f.run(["add", "."]); f.run(["commit", "-qm", "change"])
  const head = f.run(["rev-parse", "HEAD"])
  assert.equal(shouldBuild({ target: "app", base: f.base, head, cwd: f.cwd, query: () => true }), true)
  assert.equal(shouldBuild({ target: "app", base: f.base, head, cwd: f.cwd, query: () => false }), false)
})

test("root and lockfile changes always build", (t) => {
  for (const file of ["AGENTS.md", "pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
    const f = fixture(t)
    writeFileSync(path.join(f.cwd, file), "changed\n")
    f.run(["add", "."]); f.run(["commit", "-qm", "root change"])
    const head = f.run(["rev-parse", "HEAD"])
    assert.equal(shouldBuild({ target: "app", base: f.base, head, cwd: f.cwd, query: () => false }), true, file)
  }
})

test("an identical, valid base and head skips without asking Turbo", (t) => {
  const f = fixture(t)
  assert.equal(shouldBuild({ target: "app", base: f.base, head: f.base, cwd: f.cwd, query: () => { throw Error("must not run") } }), false)
})

test("unknown targets, missing refs, non-ancestor refs, and query failures build", (t) => {
  const f = fixture(t)
  assert.equal(shouldBuild({ target: "unknown", base: f.base, head: f.base, cwd: f.cwd }), true)
  assert.equal(shouldBuild({ target: "app", base: "missing", head: f.base, cwd: f.cwd }), true)
  assert.equal(shouldBuild({ target: "app", base: f.base, head: "missing", cwd: f.cwd }), true)
  writeFileSync(path.join(f.cwd, "apps", "app", "app.ts"), "changed\n")
  f.run(["add", "."]); f.run(["commit", "-qm", "change"])
  const changedHead = f.run(["rev-parse", "HEAD"])
  assert.equal(shouldBuild({ target: "app", base: f.base, head: changedHead, cwd: f.cwd, query: () => { throw Error("query failed") } }), true)
  f.run(["checkout", "-qb", "other"])
  writeFileSync(path.join(f.cwd, "apps", "app", "app.ts"), "other branch\n")
  f.run(["add", "."]); f.run(["commit", "-qm", "other branch"])
  const otherHead = f.run(["rev-parse", "HEAD"])
  assert.equal(shouldBuild({ target: "app", base: otherHead, head: f.base, cwd: f.cwd }), true)
})

test("affected build task output triggers a build for dependency changes", (t) => {
  const f = fixture(t)
  mkdirSync(path.join(f.cwd, "packages", "ui"), { recursive: true })
  writeFileSync(path.join(f.cwd, "packages", "ui", "utils.ts"), "export const value = 1\n")
  f.run(["add", "."]); f.run(["commit", "-qm", "dependency"])
  const head = f.run(["rev-parse", "HEAD"])
  const query = () => true
  assert.equal(shouldBuild({ target: "app", base: f.base, head, cwd: f.cwd, query }), true)
})
