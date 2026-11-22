---
name: local-app-agent
description: Start, inspect, authenticate to, and exercise the DeesseJS application and CLI in an isolated local agent worktree. Use when validating local startup, browser access, Better Auth fixtures, organization pages, or API-backed CLI behavior.
---

# Run and test DeesseJS locally as an agent

Use this skill when you need to bring up the DeesseJS application in a fresh agent worktree and verify it through both the browser and CLI. Read [the local worktree operator guide](../../../docs/local-agent-worktrees.md) for the full bootstrap contract and troubleshooting details. This skill is the step-by-step test procedure.

## Safety and scope

- Work from the intended Git worktree. Check `pwd`, `git branch --show-current`, and `git status --short` first. Preserve any existing edits.
- Keep all local development changes and generated application state in that worktree. Do not copy its `.env.development.local`, `.local/`, credentials, browser storage, CLI auth files, or database artifacts to another worktree.
- Use only the local PostgreSQL database created for this worktree. Never point this workflow at a shared, remote, staging, or production database.
- Do not run `reset` or `clean` unless the task explicitly authorizes destructive fixture/database operations. Those commands require `--yes` and target only the derived worktree database, but still destroy local data.
- Do not bypass Better Auth, manufacture an admin session, or call an unprotected route as a substitute for user authorization. Sign in through the actual UI and approve CLI device requests through the actual device page.
- Treat passwords, the database URL, auth secret, session cookies, device codes, and CLI tokens as secrets. Do not echo them, add them to source control, paste them into messages, or include them in screenshots. `.env.development.local` and `.local/` are ignored and private to the worktree. When an automation tool must receive a password or device code, pass it directly to that tool without logging or displaying the value.
- A successful `curl` proves server reachability only. It does not prove that T3 computer use can open the worktree, that client code hydrated, or that authentication worked.

## 1. Start and confirm the environment

The repository pins Node.js 24.x and pnpm 11.0.0. On Linux x64, `scripts/dev-agent.mjs` can download the pinned Node 24.22.3 runtime, verify its SHA-256, and install it under ignored `.local/` when the shell's Node version differs. That path requires access to `nodejs.org`, `tar`, and `xz`. On other platforms, select Node 24.x before continuing. Do not weaken the repository's Node contract to accommodate a different default runtime.

PostgreSQL must be installed and listening only on loopback. The launcher needs administrator access to create the worktree-specific role and database, either via non-interactive `sudo -n -u postgres psql` or `DEV_AGENT_PG_ADMIN_URL` pointed at a loopback PostgreSQL administrator. If loopback-only binding or database ownership cannot be confirmed, stop before any destructive database action.

Start with:

```sh
pnpm dev:agent start
```

On first run this command installs dependencies with the frozen lockfile when `node_modules` is absent, writes private local configuration, prepares the derived PostgreSQL role/database, applies migrations, builds the app's workspace dependencies, seeds verified fixtures, and starts the app and API. It prints the app URL, API URL, and browser preview port. A later start reuses the worktree's configuration, database, and port lock. Press Ctrl-C to stop it cleanly.

In a separate terminal, confirm the launcher identity and target:

```sh
pnpm dev:agent status
```

Then check the API readiness route and its worktree marker:

```sh
curl -sS -D - -o /dev/null http://localhost:<printed-port>/api/v1/ready
```

Expect HTTP 200 and an `X-Deesse-Worktree` header matching the worktree identity printed by `status`. Do not assume an already-running process on that port belongs to this worktree. The launcher probes for a free port if its preferred port is occupied and refuses readiness from another worktree. Check the process output and lock diagnostics instead of bypassing the marker check.

The launcher can encounter Next.js's documented security-upgrade notice on first start. Its supported handling is to retry the same dev-server command once after that notice. Do not patch installed Next.js files or suppress the notice. If startup still fails, report the final startup error and inspect the local process and launcher diagnostics.

Next.js can create or update a version-managed block in `apps/app/AGENTS.md` when `next dev` detects an AI coding agent. Inspect the installed version's bundled `agentRules` documentation before changing this behavior. In Next.js 16.4.3, setting `agentRules: false` removes the existing block on the next dev run, so it is not a non-mutating workaround. Keep generated guide churn out of a local-readiness change unless changing the guide is explicitly part of the task.

For manual preparation without starting the app, use:

```sh
pnpm dev:agent prepare
```

Avoid printing the contents of `.env.development.local`. If fixture values are needed to drive an automated browser, read them privately and pass them directly to the browser action. The `pnpm dev:agent credentials` command prints fixture passwords, so do not use it in a captured or user-visible terminal.

## 2. Open the real app in T3 computer use

Use T3's preview/computer-use browser for UI acceptance:

1. Check preview status and open an agent-owned tab if none is available.
2. Navigate using target kind `environment-port` and the port printed by `pnpm dev:agent start`. Do not substitute a guessed hostname, port, or Portless URL.
3. Wait for the page to finish navigation and client rendering. Capture a screenshot and inspect it when visual evidence is part of the task.
4. For data-driven pages, wait for their required API calls and UI state to settle before concluding that the page is stuck. `DOMContentLoaded` is not a client-query completion signal. Inspect the accessibility tree or DOM, console errors, and the relevant network request statuses. If the page remains loading, diagnose the pending or failed request and its query behavior; do not assert success from a timeout or a separate direct API call.

The preview currently routes a worktree through `http://localhost:<port>`. Browser cookies are scoped to host and path, not port. Better Auth therefore adds a development-only `cookiePrefix` derived from the validated 12-character `DEV_AGENT_WORKTREE_ID`. Local session cookies are HttpOnly, host-only, path `/`, and SameSite Lax; they are not Secure on local HTTP. The prefix is absent when the worktree ID is invalid or outside development. Do not claim that browser forwarding or cross-worktree cookie behavior works unless tested in the actual preview browser.

Default and incognito browser profiles have separate sessions. If a login page appears blank, first check preview status, document readiness, inputs/buttons, console, and network. Retry once in a fresh or known-good profile if the profile itself appears stalled. Do not diagnose an application auth defect from a blank profile without request or console evidence.

## 3. Sign in with the real fixture accounts

Bootstrap seeds three verified accounts with generated passwords stored in the ignored local env file:

- A normal user who owns the seeded test organization.
- A global administrator who is also an organization admin.
- A second organization member with the ordinary `member` role.

The fixture organization slug is `agent-org-<worktree-id>`. Use the normal login page at `/login` and submit the sign-in form. Do not use a test helper, direct database session insertion, or a development-only auth shortcut for browser acceptance.

Verify the signed-in identity using visible UI or a session request summarized only as HTTP status and user email. Never dump the complete session JSON: it contains a session token. To inspect cookie configuration, report the cookie name and safe attributes only, never its value.

Test global admin authorization separately from organization roles:

- The global admin fixture should reach `/admin/home` and see the administration UI.
- The normal user should receive the app's not-found response at `/admin/home`.
- An organization `owner` or `admin` role is not, by itself, proof of a global admin role.

Use independent browser profiles when keeping the normal and global-admin sessions distinct. The local cookie prefix separates worktree cookie names; a second profile separates the two test identities in one worktree.

## 4. Verify the organization members page

Sign in as the owner and open:

```text
/agent-org-<worktree-id>/settings/members
```

Wait for both the authenticated Better Auth `organization/list-members` request and the `organization.pendingInvitations` RPC to settle. In a freshly seeded worktree, the roster should show three rows: owner, admin, and member. Confirm their names/roles in the rendered UI and inspect the browser network summary and console for errors.

The current Members UI supports viewing the roster and managing invitations. It does not currently expose a remove-member action. Do not remove a fixture to prove permissions; verify authorization from the relevant API/plugin code and tests, and report that UI limitation accurately.

If the roster spinner persists while one API call returns 200, inspect both parallel requests. The component's query waits for both member listing and pending invitations. A 200 on only the member listing is not enough to establish that the query can settle. Summarize request status/errors without logging session cookies or response tokens. After a cold server restart, retry a page reload once and compare the settled DOM with the network and console. Change application code only when a reproducible defect is demonstrated.

## 5. Verify the CLI through real device authorization

The `cli` launcher builds and runs the CLI with a worktree-private home directory under `.local/cli-home`, so authorization state does not collide with another worktree. Its device login is the same authorization flow used by the product. It does not bypass app authorization.

Start login without asking the CLI to open a host browser:

```sh
pnpm dev:agent cli -- auth login --no-open
```

The command prints a verification URL and user code, then waits for approval. Keep the code private. Open the printed URL in the T3 preview browser using the same local app origin. Sign in as the intended user if asked, verify the displayed request, and explicitly approve it in the page. Wait for the CLI to complete. Do not infer success merely because the device page rendered or the authorization request was claimed. If approval is denied, expired, or reports a user mismatch, restart a fresh device flow and approve it while signed in as the same intended user.

Then run an API-backed command against this same worktree:

```sh
pnpm dev:agent cli -- organization list
```

Confirm that it lists the seeded organization. For public catalog data, `pnpm dev:agent cli -- template list --refresh` also calls the local API. CLI commands that only render help, parse arguments, or inspect local caches are not proof of an authenticated API session.

If the device server returns a relative verification URL, the CLI resolves it against the configured API base. Both relative and absolute verification URIs are supported. `--no-open` suppresses the browser opener while retaining the real device flow and printed approval instructions.

## 6. Data, reset, and cleanup

Each worktree derives its own PostgreSQL database and role from its canonical worktree path and keeps its environment file and CLI home in ignored local state. The PostgreSQL server and installed dependencies may be shared by the host, but do not share a worktree database or CLI auth file across branches.

Do not reset or delete fixtures just to call a run fresh. A cold app-process restart preserves the database and is enough to test restart behavior. If a task explicitly needs a destructive reset, inspect `pnpm dev:agent status` first and run only:

```sh
pnpm dev:agent reset --yes
```

The reset command checks the derived worktree DB identity and ownership before dropping and recreating it, then reapplies migrations and fixtures. `pnpm dev:agent clean --yes` permanently removes only that worktree's derived database and role. Do not use either command against an arbitrary connection string, shared service, or remote database.

## 7. Minimum end-to-end acceptance

Record pass/fail for each step, including the command or browser evidence. Keep secrets out of the report.

| Step | Required evidence |
|---|---|
| Fresh worktree preparation | Launcher creates private config, dependencies if absent, isolated local DB, applies migrations, and seeds fixtures. |
| Startup readiness | App URL is printed; `/api/v1/ready` is 200 and its worktree marker matches `dev:agent status`. |
| Browser reachability | T3 preview opens the `environment-port`; an inspected screenshot and settled DOM show the running page. |
| Normal user login | Real `/login` form succeeds and a protected organization page renders. |
| Global admin access control | Admin fixture sees `/admin/home`; normal fixture is denied there. |
| Organization query | Members UI renders all seeded roles after both member and invitation queries settle, with no relevant console/network error. |
| CLI authorization | CLI device flow is explicitly approved in the browser by the intended signed-in user and login completes. |
| Authenticated CLI API use | `organization list` returns the seeded organization from the same worktree app. |
| Isolation guard | Readiness marker, DB identity, cookie prefix, and CLI home are all scoped to this worktree. A true concurrent two-worktree/browser test must be reported separately if not run. |

Report what actually passed, what failed, what was skipped, and any external T3 browser or local PostgreSQL limitation. Never state that concurrent worktree isolation is runtime-verified unless two worktrees were actually exercised concurrently.

## Repository references

- [Local worktree operator guide](../../../docs/local-agent-worktrees.md)
- [Bootstrap and lifecycle implementation](../../../scripts/dev-agent.mjs)
- [Fixture seeder](../../../packages/database/scripts/dev-agent-seed.mjs)
- [Better Auth configuration](../../../packages/auth/src/auth.ts)
- [CLI device login](../../../apps/cli/src/commands/auth/login.ts)
- [Members page query and UI](../../../apps/app/components/organizations/member-management.tsx)
- [Admin route authorization](../../../apps/app/lib/admin-auth.ts)
