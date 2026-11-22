# Local agent worktrees

`pnpm dev:agent` prepares and starts one isolated DeesseJS development environment for the current Git worktree. The root package pins Node.js 24.x and pnpm 11.0.0. On Linux x64, if the current Node is not 24.x, the launcher downloads Node.js 24.22.3 from the official Node.js distribution site, verifies its pinned SHA-256, installs it under ignored `.local/`, and re-executes itself with that runtime. This requires outbound access to `nodejs.org`, plus `tar` and `xz`. On other platforms, select Node 24.x manually. The launcher installs dependencies with the frozen lockfile when `node_modules` is absent, creates a private local environment file, prepares the worktree database, applies migrations, builds the app dependencies, and starts the app and API.

## Prerequisites and startup

- pnpm 11.0.0. On Linux x64, the launcher provisions Node 24.22.3 when needed. On other platforms, Node 24.x must already be available in `PATH`.
- PostgreSQL listening on a loopback address. The bootstrap uses non-interactive `sudo -n -u postgres psql` when available. Otherwise set `DEV_AGENT_PG_ADMIN_URL` in the shell to a PostgreSQL administrator URL on `localhost`, `127.0.0.1`, or `::1`.
- The PostgreSQL administrator must be able to create a role and database. The script validates loopback listening and database ownership before using or removing the worktree database.

Run `pnpm dev:agent`. The first run installs dependencies if needed, writes `.env.development.local` with mode `0600`, creates a `0700` `.local` directory, migrates the database, builds the packages imported by the app, and seeds verified user fixtures. The command prints the app URL, API URL, and browser preview port when ready. Confirm readiness at `/api/v1/ready`; the response includes a development-only worktree marker.

The repository's Dev Container image is configured for Node 24, but this T3 Code environment reported Node 26.13.0 during implementation. Do not assume a fresh T3 worktree inherits the Dev Container image. The launcher was exercised from Node 26.13.0 and installed the verified Node 24.22.3 runtime into this worktree's `.local/` directory before continuing.

Useful commands:

```sh
pnpm dev:agent prepare       # install/configure/migrate/build without starting the app
pnpm dev:agent status        # show this worktree's identity, database and URL
pnpm dev:agent credentials   # print fixture login credentials locally
pnpm dev:agent reset --yes   # drop and recreate only this worktree database, then migrate
pnpm dev:agent clean --yes   # remove only this worktree database and role
```

The reset and clean commands require `--yes`, verify the derived database identity and owner, and never infer a target from an arbitrary `DATABASE_URL`. Keep `.env.development.local` and `.local/` private. They contain database credentials, fixture passwords, email-verification links, CLI credentials, and local authorization state. They are ignored by Git.

Press Ctrl-C to stop the app. The launcher retains its port lock across Next.js's first-run security-notice retry, then releases the lock on stop or process exit. If a process crashes, a later start validates its PID and Linux process start time before removing a stale lock. If the lock cannot be safely identified, inspect it manually instead of deleting it blindly.

## Browser and accounts

Open the printed environment port in T3 Code's browser preview. The URL is `http://localhost:<printed-port>` in this environment. Do not assume a Portless branch hostname or another hostname is forwarded to the T3 browser. Worktrees use distinct preferred ports and the launcher probes for a free port if that port is occupied. A per-worktree Better Auth cookie prefix prevents browser cookies on `localhost` from colliding across ports.

The fixture setup creates a verified normal user, a verified global administrator, an organization owner, and a second organization member. Use `pnpm dev:agent credentials` to retrieve the current worktree's local passwords. Sign in through `/login`; the application has no development-only authentication bypass. The organization appears at `/agent-org-<worktree-id>`. The organization Members settings page lists members and lets an owner/admin manage invitations. Current UI code does not render a remove-member control, although the Better Auth organization plugin retains its default remove-member authorization behavior.

The global admin area is `/admin/home`. Global admin access uses the user's global `role` value and is separate from organization owner/admin membership. Use the admin fixture for the admin page. A normal user should not be able to view that route.

## CLI

The `cli` subcommand builds and runs the CLI with a worktree-private home directory, so its auth file does not collide with another worktree:

```sh
pnpm dev:agent cli -- auth login --no-open
pnpm dev:agent cli -- organization list
pnpm dev:agent cli -- template list
```

`template list` calls this worktree's local API when its private CLI catalog
cache is empty. The namespaced command does not currently accept `--refresh`.

`auth login --no-open` runs the normal device authorization flow and prints the verification URL and user code. Open that URL in the T3 preview browser, sign in as the intended test user if needed, and approve the device. It does not bypass the application's authorization checks. CLI credentials are stored under `.local/cli-home/` with mode `0600`.

## Concurrent worktree validation

This setup was exercised with two separate Git worktrees running at the same time. Each reported a different worktree marker, PostgreSQL database and role, and app port. In one T3 browser profile, the first worktree's signed-in session did not authenticate the second port; after signing into the second worktree, returning to the first still showed the first user's session. The cookie names carried their respective worktree prefixes. The authenticated organization-list CLI command returned only the first worktree's organization, while the second worktree's public `template list` command completed against its own API. The latter is a public catalog request, not an authenticated CLI request. The device authorization flow was not repeated as part of this concurrent run.

For a repeat, keep both worktree servers running and verify each readiness marker and status-derived database/role. Use one browser profile to switch between their `environment-port` previews, checking the signed-in identity after each switch. Run `pnpm dev:agent cli -- organization list` in the authenticated worktree and `pnpm dev:agent cli -- template list` in the other. Do not run `template list --refresh`; that option is not supported by the namespaced command. Clean up only the temporary worktree's derived database and role after verifying ownership, then remove that worktree. Preserve any existing worktree database.

## Troubleshooting and boundaries

- If local Node provisioning fails, check outbound access to `nodejs.org`, `tar`, and `xz`, or select Node 24.x manually. The bootstrap keeps the repository's runtime contract and never runs app commands under Node 26.
- If PostgreSQL administration fails, check loopback listening and configure `DEV_AGENT_PG_ADMIN_URL` or non-interactive sudo access. Do not point this workflow at a shared or remote database.
- If readiness is missing or the worktree marker differs, do not attach to that process. Check the app output and start the correct worktree.
- The app currently prints a Next.js security upgrade notice and asks for one retry. The launcher retries the exact command once after detecting Next.js's retry receipt. It does not upgrade or suppress the notice.
- A normal successful local curl does not prove T3 browser forwarding. Open the printed port with the T3 preview target kind `environment-port` and inspect the page in that browser.
- If an authenticated page is stuck on "Loading organizations", verify that the app process is still listening before diagnosing the query. During fallback-port validation, A's app had exited and the preview showed a Chrome error page. Once A was restarted on its persisted port and the page was cleanly navigated, the session and organization-list requests returned 200 and the seeded organization rendered. This was a stopped-server observation, not a reproducible app loading defect.
- Separate databases and cookie prefixes isolate each worktree's app state. PostgreSQL server resources and dependencies are shared by the host, while database data and CLI credentials are worktree-specific.
