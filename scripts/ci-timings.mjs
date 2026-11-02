#!/usr/bin/env node
import { execFileSync } from "node:child_process"

const owner = "deessejs"
const repo = "deessejs"

function duration(start, end) {
  if (!start || !end) return null
  const value = (Date.parse(end) - Date.parse(start)) / 1000
  return Number.isFinite(value) && value >= 0 ? value : null
}

function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  return sorted.length ? sorted[Math.ceil(p * sorted.length) - 1] : null
}

function classify(name) {
  const s = name.toLowerCase()
  if (s.includes("checkout")) return "checkout"
  if (s.includes("pnpm/action-setup")) return "pnpm setup"
  if (s.includes("setup-node") || s.includes("setup node")) return "node setup/cache restore"
  if (s.includes("install dependencies") || s === "run pnpm install --frozen-lockfile") return "pnpm install"
  if (s.includes("postgres") || s.includes("wait for services")) return "service readiness"
  if (/test|vitest|playwright|e2e|smoke/.test(s)) return "tests"
  if (s.includes("lint")) return "lint"
  if (s.includes("typecheck") || s.includes("type check")) return "typecheck"
  if (s.includes("build")) return "build"
  if (s.includes("cache")) return "cache"
  return "other"
}

function analyze(runs) {
  const jobs = []
  for (const run of runs) {
    for (const job of run.jobs ?? []) {
      const steps = (job.steps ?? []).map(step => ({
        name: step.name,
        category: classify(step.name),
        conclusion: step.conclusion ?? step.status ?? "unknown",
        seconds: duration(step.started_at, step.completed_at),
      }))
      const runStart = run.run_started_at
      jobs.push({
        run_id: run.id,
        run_attempt: run.run_attempt ?? 1,
        workflow: run.name,
        event: run.event,
        branch: run.head_branch,
        sha: run.head_sha,
        run_url: run.html_url,
        conclusion: job.conclusion,
        job: job.name,
        runner: [job.runner_name, job.runner_group_name].filter(Boolean).join(" / ") || "not exposed",
        queued_seconds: duration(job.created_at, job.started_at),
        job_seconds: duration(job.started_at, job.completed_at),
        run_to_job_start_seconds: duration(runStart, job.started_at),
        steps,
        cache_signals: steps.filter(x => x.category === "node setup/cache restore" || x.category === "cache").map(x => ({ name: x.name, conclusion: x.conclusion, seconds: x.seconds, hit: null })),
      })
    }
  }
  return jobs
}

function summary(jobs) {
  const groups = new Map()
  for (const j of jobs) {
    const key = `${j.workflow} / ${j.job}`
    const xs = groups.get(key) ?? []
    xs.push(j)
    groups.set(key, xs)
  }
  const rows = [...groups].map(([key, xs]) => {
    const d = xs.map(x => x.job_seconds).filter(Number.isFinite)
    return { key, count: d.length, median: percentile(d, .5), p95: percentile(d, .95) }
  }).sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0))
  return rows
}

function markdown(jobs) {
  const rows = summary(jobs)
  const fmt = n => n == null ? "n/a" : `${Math.round(n)}s`
  return [
    "# GitHub Actions timing report", "",
    `Generated from ${jobs.length} job records. Job durations use GitHub native timestamps; step durations use each job's native step timestamps.`, "",
    "| Workflow / job | n | Median job time | P95 job time |", "|---|---:|---:|---:|",
    ...rows.map(r => `| ${r.key} | ${r.count} | ${fmt(r.median)} | ${fmt(r.p95)} |`), "",
    "Queue delay is job creation to job start. Run-to-job-start is a scheduling/startup proxy, not a pure runner provisioning measurement. Step timings include action execution and are not additive to the whole job when steps overlap (normally they do not). Cache hit is reported as unknown unless explicitly present in API data; setup-node's step timing alone cannot prove a hit.", "",
    "Per-run step and cache signal detail is available in the JSON output.", "",
  ].join("\n")
}

function gh(path) {
  return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }))
}

function collect(limit, event, workflow) {
  const response = gh(`repos/${owner}/${repo}/actions/runs?per_page=${Math.min(limit, 100)}`)
  const runs = response.workflow_runs.filter(r => (!event || r.event === event) && (!workflow || r.name === workflow)).slice(0, limit)
  return runs.map(r => ({ ...r, jobs: gh(`repos/${owner}/${repo}/actions/runs/${r.id}/jobs?per_page=100`).jobs }))
}

export { analyze, classify, duration, markdown, percentile, summary }

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2)
  const arg = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  try {
    const limit = Number(arg("--limit") ?? 100)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("--limit must be an integer from 1 to 100")
    const jobs = analyze(collect(limit, arg("--event"), arg("--workflow")))
    process.stdout.write(args.includes("--json") ? `${JSON.stringify({ jobs, summary: summary(jobs) }, null, 2)}\n` : markdown(jobs))
  } catch (error) {
    console.error(`CI timing collection failed: ${error.message}`)
    process.exitCode = 1
  }
}
