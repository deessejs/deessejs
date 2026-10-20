# apps/agent

You own `@deessejs-agent`, the GitHub bot. It runs on Vercel eve, answers when someone mentions it in a comment, and does nothing otherwise.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `agent/agent.ts` | The agent definition and the model it runs on. |
| `agent/channels/github.ts` | The GitHub channel: the bot name and the credentials it reads. |
| `agent/instructions.md` | The system prompt. This is the bot's behaviour. |

There is no conventional entry point. eve discovers the `agent/` directory.

## Conventions

- **The model is MiniMax-M3,** routed through the `vercel-minimax-ai-provider` community provider, with the key read from `MINIMAX_API_KEY`.
- **The `DefinedAgent` return type is explicit** on the default export. The inferred type reaches into a hoisted `@ai-sdk/provider` and raises a `TS2883` under `tsc --noEmit`.
- **The system prompt lives in `instructions.md`,** not in the TypeScript. Edit the prompt there, and keep the v1 scope in it: no tools, no sandbox, no skills, no schedules.
- **The bot only speaks when it is mentioned.** A turn starts on a comment containing `@deessejs-agent`. Events such as an opened issue, an opened pull request or a check suite are ignored.
- **The pull request diff is injected by the channel.** Do not fetch it again.

## Environment

| Variable | Purpose |
|---|---|
| `GITHUB_APP_ID` | The GitHub App identity. |
| `GITHUB_APP_PRIVATE_KEY` | The App private key. |
| `GITHUB_WEBHOOK_SECRET` | Verifies the webhook signature. |
| `MINIMAX_API_KEY` | The model provider key. |

## Commands

```bash
pnpm dev       # eve dev
pnpm build     # eve build
pnpm start     # eve start
pnpm typecheck
pnpm lint
```

Node 24 or later.

## Gotchas

- There is no test suite in this workspace. The behaviour is verified by running the bot against a real repository.
- The channel configuration decides when a turn starts. Changing the trigger is a change to the product, not a configuration detail.

## Related guides

- [Root guide](../../AGENTS.md)
