#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

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
  if (s.includes("lint")) return "lint"
  if (s.includes("typecheck") || s.includes("type check")) return "typecheck"
  if (/test|vitest|playwright|e2e|smoke/.test(s)) return "tests"
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

async function collectRuns({ limit, event, workflow, fetchPage, maxPages = 10 }) {
  const runs = []
  let totalCount = 0
  let pagesRead = 0
  for (let page = 1; page <= maxPages && runs.length < limit; page++) {
    const response = await fetchPage(page, event)
    pagesRead = page
    totalCount = response.total_count ?? totalCount
    for (const run of response.workflow_runs ?? []) {
      if ((!event || run.event === event) && (!workflow || run.name === workflow)) runs.push(run)
      if (runs.length === limit) break
    }
    if (!(response.workflow_runs ?? []).length || page * 100 >= (response.total_count ?? 0)) break
  }
  if (runs.length < limit && pagesRead < maxPages && runs.length < totalCount) {
    throw new Error(`Only ${runs.length} matching runs found, but ${limit} requested (${totalCount} API results available).`)
  }
  if (runs.length < limit && pagesRead === maxPages && runs.length < totalCount) {
    throw new Error(`Pagination safety limit reached after ${pagesRead} pages: collected ${runs.length} matching runs, ${limit} requested. Narrow the event/workflow or request fewer runs.`)
  }
  return runs
}

function isEntrypoint(moduleUrl, argvPath, platform = process.platform) {
  if (!argvPath) return false
  const pathApi = platform === "win32" ? path.win32 : path.posix
  let modulePath
  if (platform === "win32") {
    const url = new URL(moduleUrl)
    modulePath = decodeURIComponent(url.pathname).replace(/^\/(?=[A-Za-z]:)/, "")
  } else {
    modulePath = fileURLToPath(moduleUrl)
  }
  return pathApi.normalize(pathApi.resolve(modulePath)) === pathApi.normalize(pathApi.resolve(argvPath))
}

function collect(limit, event, workflow) {
  const fetchPage = async page => {
    const params = new URLSearchParams({ per_page: "100", page: String(page) })
    if (event) params.set("event", event)
    return gh(`repos/${owner}/${repo}/actions/runs?${params}`)
  }
  return collectRuns({ limit, event, workflow, fetchPage }).then(runs => runs.map(r => ({
    ...r,
    jobs: gh(`repos/${owner}/${repo}/actions/runs/${r.id}/jobs?per_page=100`).jobs,
  })))
}

export { analyze, classify, collectRuns, duration, isEntrypoint, markdown, percentile, summary }

if (isEntrypoint(import.meta.url, process.argv[1])) {
  const args = process.argv.slice(2)
  const arg = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  try {
    const limit = Number(arg("--limit") ?? 100)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("--limit must be an integer from 1 to 100")
    const jobs = analyze(await collect(limit, arg("--event"), arg("--workflow")))
    process.stdout.write(args.includes("--json") ? `${JSON.stringify({ jobs, summary: summary(jobs) }, null, 2)}\n` : markdown(jobs))
  } catch (error) {
    console.error(`CI timing collection failed: ${error.message}`)
    process.exitCode = 1
  }
}
