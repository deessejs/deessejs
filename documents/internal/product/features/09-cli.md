# 9. CLI (user-facing)

> User-facing CLI (gh/vercel-style), ships with the buyer's product — not a one-time scaffolder. This is the wedge proof. Bun is the recommended language (open P1 question).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 9.1 | User-facing CLI (gh/vercel-style) | ✅ | D | Ships with the buyer's product, **not** a scaffolder. **No competitor does this.** |
| 9.2 | Login (API key) | ✅ | C | `myapp login` |
| 9.3 | Init (scaffold a new project locally) | ✅ | C | `myapp init` |
| 9.4 | Deploy | ✅ | C | `myapp deploy` (Vercel / Cloudflare / Railway) |
| 9.5 | Logs (job logs, server logs) | ✅ | C | `myapp logs --job=<id>` |
| 9.6 | Config (per-project config) | ✅ | C | `myapp config set ...` |
| 9.7 | Whoami (current identity) | ✅ | C | `myapp whoami` |
| 9.8 | Open (browser links) | ✅ | C | `myapp open` |
| 9.9 | Plugin system (buyer-extensible) | 🟡 | U | Architecture supports; v1 ships 3-4 official plugins, buyer can write more |
| 9.10 | Self-update | ✅ | C | `myapp update` |
| 9.11 | Shell completions (bash, zsh, fish) | ✅ | U | Free polish; ships in v1 |
| 9.12 | Interactive mode (`--interactive` flag) | ✅ | U | For new users; falls back to flags for scripts |
| 9.13 | Output formats (JSON, table, plain) | ✅ | U | `--format=json` for piping |
| 9.14 | Cross-platform (macOS, Linux, Windows) | ✅ | C | Bun + cross-compile |
| 9.15 | Written in Bun | 🟡 | — | Decision: Bun for fast startup and modern default. Revisit if perf or compatibility is a problem. |

**Notes:**
- The CLI being a product feature (not a one-time scaffolder) is the wedge proof. supastarter, ShipFast, Makerkit — none of them ship a user-facing CLI as part of the buyer's product.
- 9.15 (Bun vs Node vs Go vs Rust) is the open P1 question. Recommendation: Bun.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — CLI architecture
- Related: [07-api.md](./07-api.md) — CLI consumes the public API
- Related: [08-sdk.md](./08-sdk.md) — CLI uses the SDK internally
- Open question: [`../open-questions.md`](../open-questions.md) P1 — CLI language
