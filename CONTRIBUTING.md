# Contributing to DeesseJS

Thank you for your interest in contributing to DeesseJS.

## Before you start

This repository is the organizational hub — it contains the marketing site, the Cloud per-tenant shell, the documentation site, and the shared design system. The actual template code (auth, billing, database, AI primitives, and so on) lives in the [template-starter](https://github.com/deessejs/template-starter) repository.

Please make sure you are contributing to the right repo before opening an issue or PR.

## How to contribute

### Reporting issues

Use GitHub Issues for bugs and feature requests. Please include:

- A clear, descriptive title
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- The version or commit you are running

For security issues, see [SECURITY.md](./SECURITY.md) — **do not open a public issue**.

### Pull requests

1. **Fork** the repository and create a branch from `main`.
2. **Keep changes focused.** One PR = one concern. Refactoring alongside a bug fix makes review harder.
3. **Follow the existing patterns.** Read the relevant `CLAUDE.md` or `AGENTS.md` in the app or package you are modifying.
4. **Run the checks before opening:**
   ```bash
   pnpm build
   pnpm lint
   pnpm typecheck
   ```
5. **Write a clear PR description.** Explain the *why*, not just the *what*.
6. **Link the related issue** if there is one (`Closes #123`).

### Code review

All PRs require at least one review before merge. Reviewers may request changes — this is normal, not a rejection. A good review makes the code better for everyone.

## Development setup

```bash
# Clone the repo
git clone https://github.com/deessejs/deessejs.git
cd deessejs

# Install dependencies
pnpm install

# Start all apps in parallel
pnpm dev
```

## Monorepo structure

| App / Package | Purpose |
|---|---|
| `apps/web` | Marketing site |
| `apps/app` | Cloud per-tenant shell |
| `apps/docs` | Documentation site |
| `packages/ui` | Shared design system |

## Style and conventions

- **TypeScript** everywhere. No `any`.
- **ESLint** and **TypeScript strict mode** are enforced in CI.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/). Format: `type(scope): description` (e.g., `feat(web): add pricing page`).
- **Docs** are as important as code. If you change behavior, update the relevant documentation.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
