import test from "node:test"
import assert from "node:assert/strict"
import { analyze, classify, duration, percentile, summary } from "./ci-timings.mjs"

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
