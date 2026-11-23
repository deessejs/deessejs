# Local agent worktrees

This guide is the source of truth for the local worktree environment, credentials, PostgreSQL isolation, and test commands. The concise browser and CLI procedure is in [the local-app-agent skill](../.agents/skills/local-app-agent/SKILL.md).

## Prerequisites and startup

- `package.json` `engines.node` is the Node runtime source of truth. No second patch-version pin is maintained. If the active runtime does not satisfy that engine, Linux x64 resolves the newest stable patch for the pinned major from the official Node.js distribution index, downloads its archive, and verifies it against that release's official `SHASUMS256.txt` before installation under ignored `.local/`. A newly created worktree can resolve a newer patch than an older worktree whose runtime is already cached. Other platforms need a compatible runtime on `PATH`. The pinned package manager is pnpm 11.0.0.
- PostgreSQL must listen on loopback only. The launcher uses non-interactive `sudo -n -u postgres psql` or a `DEV_AGENT_PG_ADMIN_URL` pointing to a loopback PostgreSQL administrator that can create roles and databases.
- The canonical start command is `pnpm dev:agent start`. `pnpm dev:agent` and `pnpm dev:agent --` are aliases for `start`. `pnpm dev:agent prepare` installs/configures/migrates/builds without starting the app.

On first start the launcher installs dependencies with the frozen lockfile when needed, creates `.env.development.local` with mode `0600` and `.local/` with mode `0700`, creates or verifies this worktree's PostgreSQL role and database, applies migrations, builds app dependencies, seeds verified fixtures, and starts the app/API. It prints the selected app URL, browser-preview port, API URL, and local CLI examples. The app, API, auth, web, and docs URL environment values are persisted with the selected port. Confirm `/api/v1/ready` returns HTTP 200 and an `X-Deesse-Worktree` marker matching `pnpm dev:agent status`.

The database and role names derive from the canonical worktree path. The app has a preferred per-worktree port and searches for a free port if occupied. When a fallback is selected, persisted app/API/auth and public URLs are updated to that port. The launcher holds an exclusive port lock through the server lifecycle and refuses to attach to readiness belonging to another worktree. Check `status` and the process diagnostics before trying to remove a lock.

The PostgreSQL listener and configured admin URL are checked for loopback-only access before database creation or cleanup. `reset` and `clean` require explicit `--yes`, and validate the derived database identity and owner. They affect only the current worktree's development database and role. Do not use them for routine restarts.

Useful commands:

```sh
pnpm dev:agent start
pnpm dev:agent status
pnpm dev:agent credentials
pnpm dev:agent prepare
pnpm dev:agent reset --yes
pnpm dev:agent clean --yes
```

The local files `.env.development.local` and `.local/` hold database credentials, fixture passwords, verification mail, port locks, and CLI state. They are ignored by Git. Do not copy them between worktrees or print the env file itself. The credentials command below prints only its allowlisted fixture values.

## Child-process environment and local services

The launcher constructs an explicit environment for app, migration, seed, test, CLI, and dependency-install children. It keeps runtime essentials and worktree-local settings, uses a private `.local/runtime-home`, and does not inherit arbitrary host variables. It also scans root and app dotenv files and inserts blank values for their otherwise-unset keys before Next starts. `packages/env` skips dotenv loading when `DEV_AGENT_LOCAL_RUNTIME=true`; Next's own loader gives existing `process.env` values precedence over dotenv values. This prevents root or app dotenv credentials from silently enabling a remote service in the launched app.

R2 avatar storage is unavailable in the default local runtime because all `R2_*` values are blank. Avatar upload/read/delete and avatar cleanup were not part of the local functional acceptance. The cleanup endpoint returns its not-configured response because `CRON_SECRET` is blank. Resend and Stripe credentials are blank; mail uses the console transport. GitHub OAuth/App credentials and `GITHUB_TOKEN` are blank. Public template metadata enrichment still calls GitHub anonymously when invoked, so it is an external read-only dependency. No runtime Redis/cache client or queue worker was found; Upstash values occur only in generated CLI setup text. CI's avatar integration E2E uses MinIO, but regular local startup does not provision MinIO or pass its E2E credentials. Supporting local avatar storage requires a deliberate MinIO/service-adapter option.

`pnpm install` also runs with the sanitized child environment and private home. The checked-in `.npmrc` contains only workspace hoisting settings and no registry credential keys. Dependency lifecycle scripts still execute package code and can access the repository and configured package registry; dependency installation therefore remains a package supply-chain trust boundary, not an isolated sandbox. Proxy and arbitrary registry-auth environment variables are not inherited.

## Fixture credentials and browser login

The seeder creates a verified normal owner, a global administrator who is also an organization admin, and a second organization member. The organization slug is `agent-org-<worktree-id>`. Global admin permission comes from the global user role, not the organization role.

`pnpm dev:agent credentials` prints the usernames and generated passwords for this worktree's normal owner, global administrator, and organization member. It is allowed to print only after validating the owned, non-symlink, mode-0600 `.env.development.local`, `NODE_ENV=development`, exact worktree path and derived database identity, a loopback database URL, loopback-only PostgreSQL listener and correct database owner, local app/auth/API/web/docs URLs, console mail transport, the three expected `example.test` usernames, and generated fixture-password format. It prints no database URL/password, auth secret, or unrelated env-file values. Use it only for the isolated local fixture setup. The fixture passwords are disposable and may appear in captured T3 command output; never use this command with shared or production credentials.

The installed T3 preview `type` action accepts literal text and has no secret-reference or private clipboard input. For these disposable worktree fixtures, it is acceptable to enter the password printed by the guarded credentials command into the real `/login` form with that action. Do not use literal browser input for production, shared, or other non-fixture credentials. T3 Code's private secret request instead accepts a secret through a private card and can deliver a one-use reference to compatible tools or a private file for shell commands; the preview typing action does not accept that reference. The upload action selects a file for a page file input and cannot populate a password field.

The official T3 description of secret requests is in [T3 Code secrets documentation](https://github.com/pingdotgg/t3code/blob/main/docs/user/secrets.md#when-an-agent-asks-for-a-secret). The tool schema available in this environment documents `secretRef` and private-file delivery. The preview tool schema exposes literal text and no secure input counterpart.

## Browser use

Open the app through T3 preview using target kind `environment-port` and the selected port printed by the launcher. Local curl verifies only server reachability. Inspect an actual screenshot and DOM in the T3 browser. Wait for client-side queries to settle; on data-driven pages inspect all required API requests and browser console errors before concluding that a page is stuck.

The preview uses `localhost:<port>`. Cookies are scoped to hostname and path, not port, so Better Auth uses a development-only cookie prefix derived from `DEV_AGENT_WORKTREE_ID`. Inspect cookie names and safe attributes only. Never report cookie values or full session JSON.

The organization page and member settings route use the seeded worktree slug. The roster includes owner, admin, and member roles. The current members UI lists the roster and invitation management controls; it does not provide a member-removal action. `/admin/home` is protected by the global user role. Use the guarded fixture command for real UI login checks, and verify admin access and normal-user denial separately.

T3 preview reachability has been exercised with environment-port URLs. Portless and branch-host routing have not been verified or integrated. Do not infer that a branch hostname reaches the browser from local server readiness.

## CLI use

The `cli` subcommand builds and runs the CLI with a worktree-private home in `.local/cli-home`, preventing CLI auth files from being shared across worktrees.

```sh
pnpm dev:agent cli -- organization list
pnpm dev:agent cli -- template list
```

`organization list` requires an authenticated device-flow session and calls this worktree's API. `template list` is public and calls this worktree's API when the private CLI cache is empty. The namespaced command does not support `--refresh`.

`auth login --no-open` retains normal device authorization, prints the verification URL and user code, waits for approval, and stores its token under the worktree-private CLI home. Keep the one-time code private. The normal path is to open the verification URL in T3 preview and approve while signed in as the intended user. If browser controls cannot complete that path in a local automation check, a test harness may sign in to the local API with a fixture account using the correct local `Origin`, then use the existing authenticated `GET /api/v1/auth/device?user_code=...` claim and `POST /api/v1/auth/device/approve` routes with that same session. This is the normal Better Auth device-authorization flow, not an authorization bypass: do not manufacture sessions or call approval without first authenticating and claiming the request. Keep the code and session cookie in ignored local state and out of logs.

After an authenticated API-backed CLI command, sign out with:

```sh
pnpm dev:agent cli -- auth logout --json
```

Successful output reports `localTokenCleared: true`, `serverSignOutSucceeded: true`, and the successful HTTP `serverStatus`. The CLI removes its local auth file even when the server returns a non-success response; in that case `serverSignOutSucceeded` is false, so report server revocation as unconfirmed. A `reason: "no_session"` result means no local token was present and no server sign-out request was made. Check for the auth file's absence without opening or displaying it. Never expose its token or related session values.

## Tests and database isolation

Run the lightweight launcher regression suite without PostgreSQL:

```sh
pnpm test:dev-agent
```

This checks URL selection, worktree-derived test database identity validation, non-revealing credential output, and redaction of sensitive test log values.

For the full Turbo workspace test suite, first complete local setup with `pnpm dev:agent prepare`, then run:

```sh
pnpm dev:agent test
```

This command requires the loopback PostgreSQL administrator described above. It creates a unique test database and role derived from the worktree identity plus a random run identity, verifies the exact loopback URL and identity, applies migrations, then runs `pnpm exec turbo run test` with both `DATABASE_URL` and `TEST_DATABASE_URL` set to that disposable database. It captures child output, redacts fixture passwords, database/auth URLs, and common device/token fields, then prints the redacted output. A `finally` cleanup drops only the exact run database after confirming its owner, and then its matching role. The normal seeded development database is never the test target. If the process is forcibly killed before cleanup, an orphaned uniquely named test database/role may remain; do not remove it without verifying its worktree/run identity and owner.

CI runs `pnpm turbo test` and `pnpm test:dev-agent` separately. The local `dev:agent test` path is the explicit way to run workspace tests with a dedicated migrated PostgreSQL test database. Do not point tests at `.env.development.local`'s normal development database, another worktree's database, or any remote database.

### Verified coverage and limits

- Two distinct Git worktrees were previously run at the same time. They used distinct worktree markers, databases, roles, app ports, and cookie prefixes. In one browser profile, switching ports required separate real UI logins; returning to the first worktree retained its session.
- The authenticated organization-list command returned only its own worktree's organization. The other worktree's public `template list` completed against its own API. This does not prove concurrent authenticated CLI sessions.
- A second authenticated device-authorization flow was not run concurrently for the second worktree. Multiple simultaneous T3 agents were not tested. Portless or branch-host routing was not tested.
- The preview typing action records literal input. Use it only with the disposable passwords from this worktree's guarded fixture command, never with shared or production credentials.

These are functional startup and app/CLI checks. Deep security, performance, and architecture auditing are separate work.

## Troubleshooting

- If the launcher cannot select Node, check access to `nodejs.org`, `tar`, and `xz` on Linux x64, or select Node 24.x manually.
- If PostgreSQL setup fails, verify loopback-only `listen_addresses`, non-interactive administrator access, and ownership reported by `pnpm dev:agent status`. Do not substitute a remote database.
- If readiness is missing or its worktree marker differs, do not attach the browser or CLI to that process. Inspect the launcher output and port-lock owner.
- If the selected port differs from the preferred port, use the URL printed by the launcher and confirm all persisted URLs with `status` and readiness before opening the preview.
- A successful readiness request does not prove browser forwarding, UI hydration, login, or API-backed CLI authorization. Test each through its actual interface with the guarded local fixture credentials.
