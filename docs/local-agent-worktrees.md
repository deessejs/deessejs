# Local agent worktrees

This guide is the source of truth for the local worktree environment, credentials, PostgreSQL isolation, and test commands. The concise browser and CLI procedure is in [the local-app-agent skill](../.agents/skills/local-app-agent/SKILL.md).

## Prerequisites and startup

- The repository pins Node.js 24.x and pnpm 11.0.0. On Linux x64 the launcher can install its checksum-verified Node.js 24.22.3 runtime under the ignored `.local/` directory when the active Node major differs. Other platforms need Node 24.x already on `PATH`.
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

The local files `.env.development.local` and `.local/` hold database credentials, fixture passwords, verification mail, port locks, and CLI state. They are ignored by Git. Do not copy them between worktrees or print their contents.

## Fixture credentials and browser login

The seeder creates a verified normal owner, a global administrator who is also an organization admin, and a second organization member. The organization slug is `agent-org-<worktree-id>`. Global admin permission comes from the global user role, not the organization role.

`pnpm dev:agent credentials` prints account emails, the organization slug, and a private handoff instruction. It never prints a password. The generated passwords remain in `.env.development.local` with mode `0600`. A human who owns the T3 environment must open that file in a private local editor and enter a selected password directly into the real `/login` form. Do not use `cat`, put the value in a shell command, or include it in a message or screenshot.

T3 Code's private secret request accepts user-entered secrets and can deliver a one-use reference to compatible tools or a private file for a shell command. The installed preview `type` action accepts literal `text` only; it has no secret-reference or private clipboard input. Its upload action selects a file for a page file input and cannot populate a password field. Therefore shell secret delivery does not provide a safe unattended browser-login path. If a human cannot enter the fixture password directly, mark browser authentication blocked rather than passing the value through browser automation.

The official T3 description of secret requests is in [T3 Code secrets documentation](https://github.com/pingdotgg/t3code/blob/main/docs/user/secrets.md#when-an-agent-asks-for-a-secret). The tool schema available in this environment documents `secretRef` and private-file delivery. The preview tool schema exposes literal text and no secure input counterpart.

## Browser use

Open the app through T3 preview using target kind `environment-port` and the selected port printed by the launcher. Local curl verifies only server reachability. Inspect an actual screenshot and DOM in the T3 browser. Wait for client-side queries to settle; on data-driven pages inspect all required API requests and browser console errors before concluding that a page is stuck.

The preview uses `localhost:<port>`. Cookies are scoped to hostname and path, not port, so Better Auth uses a development-only cookie prefix derived from `DEV_AGENT_WORKTREE_ID`. Inspect cookie names and safe attributes only. Never report cookie values or full session JSON.

The organization page and member settings route use the seeded worktree slug. The roster includes owner, admin, and member roles. The current members UI lists the roster and invitation management controls; it does not provide a member-removal action. `/admin/home` is protected by the global user role. Verify admin access and normal-user denial through the real UI when safe credentials are available.

T3 preview reachability has been exercised with environment-port URLs. Portless and branch-host routing have not been verified or integrated. Do not infer that a branch hostname reaches the browser from local server readiness.

## CLI use

The `cli` subcommand builds and runs the CLI with a worktree-private home in `.local/cli-home`, preventing CLI auth files from being shared across worktrees.

```sh
pnpm dev:agent cli -- organization list
pnpm dev:agent cli -- template list
```

`organization list` requires an authenticated device-flow session and calls this worktree's API. `template list` is public and calls this worktree's API when the private CLI cache is empty. The namespaced command does not support `--refresh`.

`auth login --no-open` retains normal device authorization, prints the verification URL and user code, waits for approval, and stores its token under the worktree-private CLI home. Do not use an unauthenticated route or bypass authorization. In environments where shell output is captured, the code can appear in tool activity. Do not start this flow unless a human can keep the approval details private and approve as the same signed-in user. The available preview action cannot accept a private secret reference or paste the code without exposing its literal input.

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
- Automated browser password entry is not safe with the installed T3 preview action. UI login checks require a human password handoff.

These are functional startup and app/CLI checks. Deep security, performance, and architecture auditing are separate work.

## Troubleshooting

- If the launcher cannot select Node, check access to `nodejs.org`, `tar`, and `xz` on Linux x64, or select Node 24.x manually.
- If PostgreSQL setup fails, verify loopback-only `listen_addresses`, non-interactive administrator access, and ownership reported by `pnpm dev:agent status`. Do not substitute a remote database.
- If readiness is missing or its worktree marker differs, do not attach the browser or CLI to that process. Inspect the launcher output and port-lock owner.
- If the selected port differs from the preferred port, use the URL printed by the launcher and confirm all persisted URLs with `status` and readiness before opening the preview.
- A successful readiness request does not prove browser forwarding, UI hydration, login, or API-backed CLI authorization. Test each through its actual interface when safe credentials are available.
