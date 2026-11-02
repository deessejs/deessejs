# Collecting a CI performance baseline

The timing collector reads GitHub Actions run and job records through the authenticated GitHub CLI. It does not trigger workflows or modify GitHub. It emits a Markdown summary by default and can emit detailed JSON for further analysis.

## Requirements and collection

Use a GitHub CLI login with read access to Actions for `deessejs/deessejs`, and Node.js available locally. From the repository root:

```sh
node scripts/ci-timings.mjs --limit 100 --event pull_request --workflow CI
node scripts/ci-timings.mjs --limit 100 --event pull_request --workflow CI --json > /tmp/ci-timings.json
```

The API currently returns at most 100 runs per request in this tool. Repeat collection over time to reach at least 30 distinct PR commits (prefer 100 or more runs for a stable P95). Do not count reruns as independent commits: group by run ID and attempt, report reruns separately, and group PR runs by head SHA. Keep pull requests, staging pushes, nightly/manual dispatches, cancelled runs, and failures in separate cohorts. The collector reports run ID, attempt, SHA, branch, event, URL, job name, runner metadata when exposed, job conclusion, native queue/job timings, native per-step timing, and step category. It never reads environment values or logs.

## Interpreting the timings

- **Queue delay** is job creation to job start. It can include scheduling delay and is not a pure hosted-runner queue metric.
- **Run-to-job-start** compares workflow start to job start. It is a startup/scheduling proxy, not isolated runner provisioning.
- **Job duration** is native job start to completion. It includes checkout, setup, dependency install, work, and finalization.
- **Step duration** is the native GitHub step start/end interval. Use it to attribute checkout, setup, install, service readiness, tests, lint, typecheck, or build where step names permit. Uncategorized and composite action steps should remain visible as `other` until classified deliberately.
- The script classifies setup-node as `node setup/cache restore`, but **does not infer a cache hit** from that duration. A cache hit is `unknown` unless the API exposes an explicit signal. GitHub's Jobs API does not generally expose action step outputs; use the relevant action log or a separately recorded output for hit/miss evidence. Do not scrape arbitrary logs or print secrets to manufacture a signal.
- Compute median and P95 on job durations by workflow/job and cohort. The script uses nearest-rank P95. With 30 observations P95 is near the maximum and still noisy; prefer 100+ observations. Include sample count and distinguish cold/warm cache only when directly observed.
- **Critical path** is the latest completion among the checks required for a PR SHA, not the sum of job runtimes. Within CI, use the slowest concurrently running required job. Compare integration job steps, especially install, MinIO build/readiness, migrations, dependency build, and test steps, to locate its critical path.
- **Aggregate compute** is the sum of job durations, not wall time. It is a runner-time proxy, not billing. Translate to cost only with runner OS/size, billing multipliers, and organization billing rules.

## Provenance and limitations

The collector uses `GET /repos/deessejs/deessejs/actions/runs` and `GET /repos/deessejs/deessejs/actions/runs/{run_id}/jobs`, via `gh api`. Timestamps, job conclusions, runner metadata, and step intervals come from those GitHub API responses. The report includes run URL, ID, attempt, event, branch, and head SHA for traceability. It makes no claims about cache hit state unless GitHub returns an explicit value. Workflow creation/start timestamps, job creation/start timestamps, and step timestamps have different meanings and must not be conflated.

Collection is read-only but requires an authenticated account permitted to read Actions metadata. The current implementation reads the latest page (up to 100 runs) and then retrieves jobs for the selected runs. It does not collect workflow runs across pages, enumerate required-check rules, query billing, or inspect logs. Repeat collections periodically for larger cohorts. The collector adds no workflow/job, does not affect branch protection or CI behavior, and creates no artifacts or tracked output.

## Validation

Run the focused parser/calculation tests with:

```sh
node --test scripts/ci-timings.test.mjs
```
