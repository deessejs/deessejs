# `apps/agent` — `@deessejs-agent`

A minimal mentionable GitHub agent for the DeesseJS monorepo, built on
[Vercel eve](https://eve.dev). v1 scope: a single agent that replies when
mentioned in a GitHub comment. No tools, no sandbox, no skills, no
schedules — just the mention loop.

## Scope (v1)

- Responds to `@deessejs-agent` mentions on issues, pull requests, and
  review threads in any repo where the GitHub App is installed.
- Reads the PR diff when summoned on a PR (auto-injected by the eve GitHub
  channel).
- Knows the contents of `agent/instructions.md` (the system prompt).
- Model: **MiniMax-M3** via the
  [`vercel-minimax-ai-provider`](https://www.npmjs.com/package/vercel-minimax-ai-provider)
  community AI SDK package.

## Out of scope (deferred to v2+)

- Tools (no file reads, no command execution, no PR creation, no label
  application).
- Sandbox (no bash, no checkout beyond what the GitHub channel injects).
- Skills (no `SKILL.md`).
- Schedules and subagents.
- Auto-review or auto-triage on PR open / issue open — the bot only
  replies when explicitly mentioned.
- Vercel Connect. v1 uses bring-your-own GitHub App credentials so the
  agent runs on plain env vars.

## Prerequisites

- Node.js 24+ (the agent runtime requires it; the rest of the monorepo
  stays on Node 22+).
- pnpm 11+ (matches the rest of the monorepo).
- A MiniMax API key for the `MiniMax-M3` model.
- A GitHub App you own, with the webhook pointed at the deployed agent.

## Setup

### 1. Install dependencies

From the repository root:

```bash
pnpm install
```

### 2. Create the GitHub App

1. Open <https://github.com/settings/apps/new>.
2. **GitHub App name**: pick something like `DeesseJS Agent (dev)`.
3. **Homepage URL**: your repo URL.
4. **Webhook URL**: `https://<your-vercel-deployment>/eve/v1/github`
   (you'll fill in the real deployment URL after step 4).
5. **Webhook secret**: generate a random string and paste it. You'll need
   the same value later for `GITHUB_WEBHOOK_SECRET`.
6. **Repository permissions**:
   - Issues: Read & write
   - Pull requests: Read & write
   - Metadata: Read-only (required)
   - Contents: Read-only (the channel uses the installation token to read
     repo state; no writes in v1)
7. **Subscribe to events**:
   - Issue comments
   - Pull request review comments
   - (Only those two for v1. The agent only runs when mentioned in a
     comment.)
8. Click **Create GitHub App**.
9. On the App's settings page, note the **App ID** (top of "General")
   and generate a **private key** (bottom of "General"). Download the
   `.pem` file — you'll paste its contents into `GITHUB_APP_PRIVATE_KEY`.

### 3. Configure environment variables

Copy `apps/agent/.env.example` to `apps/agent/.env.local` and fill in:

```bash
MINIMAX_API_KEY=sk-...
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=the-string-you-set-on-the-app
```

Notes:
- `GITHUB_APP_PRIVATE_KEY` is a multi-line PEM. Preserve the newlines
  (`\n` works in `.env` files) or use a single-line base64-encoded form.
- All four values are required for the bot to start. Missing values
  fail loud at boot — the agent does not run in a degraded mode.

### 4. Deploy to Vercel

From the repository root:

```bash
cd apps/agent
vercel link      # link to (or create) a Vercel project
vercel env add MINIMAX_API_KEY
vercel env add GITHUB_APP_ID
vercel env add GITHUB_APP_PRIVATE_KEY
vercel env add GITHUB_WEBHOOK_SECRET
vercel deploy --prod
```

Copy the production deployment URL. It looks like
`https://agent-<hash>.vercel.app`.

### 5. Update the GitHub App webhook URL

Go back to the App's settings page and set **Webhook URL** to
`https://<your-vercel-deployment>/eve/v1/github`. Save.

### 6. Install the GitHub App on a repo

1. On the App's settings page, click **Install App** in the sidebar.
2. For v1, install it on **only one repo** — `deessejs/deessejs` is the
   default. Choose "Only select repositories" and pick that one.
3. Confirm.

### 7. Test the mention loop

1. Open any issue or pull request in `deessejs/deessejs`.
2. Post a comment that contains `@deessejs-agent what does this repo do?`.
3. Within a few seconds the bot should react with 👀 and then post a
   reply in the thread.

If nothing happens, check the Vercel deployment logs for the agent.

## Local development

From `apps/agent`:

```bash
pnpm dev
```

This starts `eve dev` — an interactive TUI you can chat with locally.
GitHub webhook delivery still requires a public URL; for end-to-end
testing, use a tunnel (e.g. `cloudflared tunnel` or `ngrok`) and point
the GitHub App's webhook URL at the tunnel.

## File layout

```
apps/agent/
├── README.md                    this file
├── package.json                 name: "agent", engines.node >=24
├── tsconfig.json                extends @workspace/typescript-config/base
├── eslint.config.mjs            extends @workspace/eslint-config/base
├── .env.example                 template for required env vars
├── .gitignore
└── agent/
    ├── agent.ts                 defineAgent({ model: minimax("MiniMax-M3") })
    ├── instructions.md          the always-on system prompt
    └── channels/
        └── github.ts            githubChannel({ botName: "deessejs-agent" })
```

## Architecture notes

- **No sandbox by default.** The eve framework provides one if you opt
  in via `agent/sandbox/sandbox.ts`, but v1 deliberately does not — the
  bot only needs to read context, not run code.
- **Default dispatch, no custom hooks.** The `githubChannel` config keeps
  eve's default invocation-token gate. The bot ignores `issues`,
  `pull_request`, `check_suite`, etc. unless you add the corresponding
  hooks to `agent/channels/github.ts`.
- **PR diff in context.** When summoned on a PR, eve injects the diff
  into the model context automatically. The bot can reference changed
  files without you wiring up any tool.
- **Bring-your-own credentials, not Vercel Connect.** Connect is the
  zero-secret option (`connectGitHubCredentials`); v1 uses
  `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_WEBHOOK_SECRET`
  instead so the agent is deployable outside Vercel's hosted Connect
  flow.

## Next steps (v2 candidates)

- Switch to Vercel Connect for zero-secret GitHub App management.
- Add a `bash` tool and the default `read_file` / `glob` / `grep`
  tools under the default `sandbox/sandbox.ts` so the bot can answer
  questions about the actual repo state.
- Add a `code-review` skill that runs `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, and Vale against the PR diff in the sandbox.
- Add an `onPullRequest` hook so the bot auto-reviews new PRs without
  being mentioned.
