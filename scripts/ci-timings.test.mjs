import test from "node:test"
import assert from "node:assert/strict"
import { analyze, classify, collectRuns, duration, isEntrypoint, percentile, summary } from "./ci-timings.mjs"

test("duration rejects missing, invalid, and negative timestamps", () => {
  assert.equal(duration("2026-01-01T00:00:00Z", "2026-01-01T00:00:05Z"), 5)
  assert.equal(duration(undefined, "2026-01-01T00:00:05Z"), null)
  assert.equal(duration("bad", "2026-01-01T00:00:05Z"), null)
  assert.equal(duration("2026-01-01T00:00:05Z", "2026-01-01T00:00:00Z"), null)
})

test("nearest-rank percentiles ignore missing observations", () => {
  assert.equal(percentile([4, 1, 2, null, 3], .5), 2)
  assert.equal(percentile([4, 1, 2, 3], .95), 4)
  assert.equal(percentile([null], .5), null)
})

test("step categories capture common bootstrap and validation names", () => {
  assert.equal(classify("Set up job"), "other")
  assert.equal(classify("Checkout"), "checkout")
  assert.equal(classify("Run pnpm install --frozen-lockfile"), "pnpm install")
  assert.equal(classify("Run integration tests"), "tests")
  assert.equal(classify("Typecheck create-deesse-app e2e harness"), "typecheck")
  assert.equal(classify("Run packed CLI init regression test:e2e:init"), "tests")
})

test("entrypoint comparison handles POSIX and Windows paths", () => {
  assert.equal(isEntrypoint("file:///repo/scripts/ci-timings.mjs", "/repo/scripts/ci-timings.mjs", "linux"), true)
  assert.equal(isEntrypoint("file:///C:/repo/scripts/ci-timings.mjs", "C:\\repo\\scripts\\ci-timings.mjs", "win32"), true)
  assert.equal(isEntrypoint("file:///C:/repo/scripts/ci-timings.mjs", "C:\\repo\\scripts\\other.mjs", "win32"), false)
})

test("collectRuns paginates mixed workflows to requested matching cohort", async () => {
  const calls = []
  const pages = [
    { total_count: 250, workflow_runs: Array.from({ length: 100 }, (_, i) => ({ id: i, event: "pull_request", name: i < 10 ? "CI" : "Other" })) },
    { total_count: 250, workflow_runs: Array.from({ length: 100 }, (_, i) => ({ id: 100 + i, event: "pull_request", name: i < 20 ? "CI" : "Other" })) },
    { total_count: 250, workflow_runs: Array.from({ length: 50 }, (_, i) => ({ id: 200 + i, event: "pull_request", name: "CI" })) },
  ]
  const runs = await collectRuns({ limit: 25, event: "pull_request", workflow: "CI", fetchPage: async (page, event) => { calls.push([page, event]); return pages[page - 1] } })
  assert.equal(runs.length, 25)
  assert.deepEqual(calls, [[1, "pull_request"], [2, "pull_request"]])
  assert.equal(runs.at(-1).id, 114)
})

test("collectRuns fails rather than silently returning undersized samples", async () => {
  await assert.rejects(collectRuns({ limit: 4, workflow: "CI", fetchPage: async () => ({ total_count: 4, workflow_runs: [{ name: "Other" }] }) }), /Only 0 matching runs found/)
  await assert.rejects(collectRuns({ limit: 2, workflow: "CI", maxPages: 1, fetchPage: async () => ({ total_count: 250, workflow_runs: [{ name: "CI" }] }) }), /safety limit reached/)
})

test("analyze preserves provenance and reports cache hit as unknown", () => {
  const [job] = analyze([{
    id: 42, run_attempt: 2, name: "CI", event: "pull_request", head_branch: "feature", head_sha: "abc",
    run_started_at: "2026-01-01T00:00:00Z", html_url: "https://github.com/example/repo/actions/runs/42",
    jobs: [{ name: "Test", conclusion: "failure", created_at: "2026-01-01T00:00:01Z", started_at: "2026-01-01T00:00:03Z", completed_at: "2026-01-01T00:00:10Z", steps: [
      { name: "Setup Node", started_at: "2026-01-01T00:00:03Z", completed_at: "2026-01-01T00:00:04Z", conclusion: "success" },
    ] }],
  }])
  assert.equal(job.run_id, 42)
  assert.equal(job.run_attempt, 2)
  assert.equal(job.queued_seconds, 2)
  assert.equal(job.run_to_job_start_seconds, 3)
  assert.equal(job.job_seconds, 7)
  assert.equal(job.steps[0].seconds, 1)
  assert.equal(job.cache_signals[0].hit, null)
  assert.equal(summary([job])[0].median, 7)
})
