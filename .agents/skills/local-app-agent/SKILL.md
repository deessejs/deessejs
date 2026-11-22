---
name: local-app-agent
description: Run and functionally test DeesseJS in one local worktree through its browser UI and CLI.
---

# Test DeesseJS locally as an agent

Use this procedure to start and functionally test the app and CLI in one worktree. The canonical commands, prerequisites, isolated database behavior, and troubleshooting are maintained in [Local agent worktrees](../../../docs/local-agent-worktrees.md). Use that guide as the source of truth for environment mechanics.

This skill covers functional app and CLI testing.

## Safety

- Confirm the current worktree and preserve its existing edits and local state. Keep generated files, credentials, browser storage, and CLI auth files in that worktree.
- Use only its loopback PostgreSQL resources. Do not reset or clean data unless the task explicitly authorizes it.
- Multiple sessions may be operating at once. Never stop, kill, lock out, reset, clean, or otherwise interfere with another session or worktree. If ownership or contention is uncertain, stop the affected operation and message the user with the evidence.
- Never bypass Better Auth or manufacture a session. Use the real UI login and real device approval flow.
- Treat fixture passwords, database URLs, auth secrets, email links, device codes, session cookies, and CLI tokens as secrets. Do not read them into chat or captured tool output.
- Use only a browser input method documented as secret-safe. Otherwise ask the user to enter the fixture password privately and continue independent checks. Follow the operator guide for the credential handoff.

## Procedure

1. Start the current worktree with the canonical command documented in the operator guide. Run `pnpm dev:agent status` in another terminal and verify `/api/v1/ready` returns HTTP 200 with this worktree's marker.
2. Open the printed app port in T3 preview using the `environment-port` target. Inspect a screenshot and settled page DOM. For data-driven pages, wait for their required API calls and inspect request status and console before deciding that a page is stuck.
3. For UI authentication, use only a browser input method documented as secret-safe. Otherwise ask the user to enter the normal or admin fixture password privately in the real login form. Confirm the resulting identity and protected page. Keep normal-user denial and global-admin access as separate checks.
4. Inspect the seeded organization and member page after its member and invitation queries settle. Verify visible roles and report any missing UI action as a product limitation. Do not remove fixture members just to test permissions.
5. If an authenticated CLI session already exists for this worktree, run an API-backed command such as `pnpm dev:agent cli -- organization list` and confirm the returned organization belongs to this worktree. To create a session, use the genuine device flow only when its approval details can remain private and a human can approve them as the same user. If they cannot, ask the user for a private handoff and continue independent checks.
6. Run `pnpm test:dev-agent` for deterministic launcher helper tests. Run `pnpm dev:agent test` for the full workspace test suite with a separate worktree-derived disposable database. Never set either test database to the normal seeded development database.
7. Report the commands and evidence actually observed, plus any browser, credential-handoff, or database limitation. Do not infer a settled UI state from curl or an early document snapshot.

## Reference

- [Environment mechanics and test prerequisites](../../../docs/local-agent-worktrees.md)
- [Launcher implementation](../../../scripts/dev-agent.mjs)
- [Fixture seeder](../../../packages/database/scripts/dev-agent-seed.mjs)
- [Better Auth configuration](../../../packages/auth/src/auth.ts)
- [CLI device authorization](../../../apps/cli/src/commands/auth/login.ts)
