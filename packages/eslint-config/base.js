import js from "@eslint/js"
import tseslint from "typescript-eslint"
import sonarjs from "eslint-plugin-sonarjs"

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**", "node_modules/**"],
  },
  {
    rules: {
      // Cognitive-complexity guard. SonarJS' metric is closer to a human's
      // reading cost than raw cyclomatic: nested branches weigh more than
      // sibling branches, || / ?. chains are counted, etc.
      //
      // Phase 1 starts at warn@30 — a deliberate "all-clear" threshold that
      // lets the entire existing codebase stay green on adoption. We pay the
      // debt down via the weekly `complexity-report` artifact, then tighten
      // to warn@15 (Phase 2) and eventually warn@10/error@20 (Phase 3-4).
      // See docs/engineering/processes/complexity-rollout.md.
      "sonarjs/cognitive-complexity": [
        "warn",
        30,
      ],
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-nested-switch": "error",

      // Phase 0 — SonarJS recommended config ships with several rules that produce
      // false positives against pre-existing code in this monorepo. We disable
      // them at adoption time and re-enable them in focused follow-ups after
      // the affected code is triaged. See docs/engineering/processes/complexity-rollout.md.
      //
      // Re-enablement tracking:
      //   - sonarjs/no-clear-text-protocols, sonarjs/code-eval
      //     blocked by `packages/utils/tests/safe-redirect.test.ts` (security tests)
      //   - sonarjs/pseudo-random
      //     blocked by `packages/ui/src/components/sidebar.tsx` (intentional Math.random())
      //   - sonarjs/void-use
      //     blocked by `packages/auth/src/auth.ts:69,89` — the project's own `no-restricted-syntax`
      //     rule on bare `void` already enforces error-handling discipline. SonarJS' blanket ban
      //     forbids valid `void` on member-access expressions.
      //   - sonarjs/no-hardcoded-passwords
      //     blocked by `packages/auth/tests/email.test.ts:72` (test fixtures)
      //   - sonarjs/no-duplicate-string
      //     blocked by repeated test fixtures and assertion messages across the tree
      //   - sonarjs/no-identical-functions
      //     blocked by duplicated test helpers across the tree
      //   - sonarjs/no-useless-catch
      //     blocked by framework-internal catches that re-throw with context
      //   - sonarjs/assertions-in-tests
      //     blocked by RPC/health-check tests that intentionally fire-and-assert via side-effects (DB writes, network)
      //   - sonarjs/publicly-writable-directories
      //     blocked by CLI tests that intentionally write to /tmp and other writable dirs
      //   - sonarjs/todo-tag
      //     blocked by TODO comments left in test fixtures (intentional backlog markers)
      //   - sonarjs/no-nested-template-literals
      //     blocked by `apps/cli/src/commands/info.ts:29` (CLI banner formatting)
      //   - sonarjs/concise-regex
      //     blocked by `apps/app/components/auth/password-strength.tsx:19` (deliberate readable regex)
      //   - sonarjs/no-nested-conditional
      //     blocked by auth/profile-form ternaries (readable as-is, refactor would harm DX)
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/code-eval": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/void-use": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-identical-functions": "off",
      "sonarjs/no-useless-catch": "off",
      "sonarjs/assertions-in-tests": "off",
      "sonarjs/publicly-writable-directories": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/no-nested-template-literals": "off",
      "sonarjs/concise-regex": "off",
      "sonarjs/no-nested-conditional": "off",

      // Defeat open-redirect via protocol-relative URLs (//evil.com) and
      // backslash bypass (/\\evil.com). See CVE-2025-27143. Any router.push,
      // window.location, or NextResponse.redirect whose first argument calls
      // searchParams.get() must route through safeRedirect() first.
      // Ban bare `void` on promise-returning calls — drops error handling
      // (audit §3.6: silent email-send failures). Use .then/.catch or a
      // named helper that inspects the result.
      // Ban `authClient.useSession()` (Better Auth specific) — it's a
      // hook named like a getter; calling it inside an async callback is a
      // Rules of Hooks violation (audit §3.5). For one-shot reads, use
      // `authClient.getSession()` instead. Other `use*` calls (React, Next,
      // useState, usePathname, etc.) are valid React hooks — not flagged.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='push'] > CallExpression[callee.object.name='searchParams'][callee.property.name='get']",
          message:
            "router.push(searchParams.get(...)) is an open-redirect vector. Use safeRedirect() from @workspace/utils/safe-redirect first.",
        },
        {
          selector:
            "CallExpression[callee.property.name='assign'][arguments.0.callee.property.name='get']",
          message:
            "window.location.assign(searchParams.get(...)) is an open-redirect vector. Use safeRedirect() first.",
        },
        {
          selector:
            "ExpressionStatement > UnaryExpression[operator='void'] > CallExpression[callee.type='Identifier']",
          message:
            "bare `void` on a top-level function call drops error handling. Use `.then(result => ...)` / `.catch(...)` or a named helper that inspects the result. (Method chains like `void obj.method()` are valid — the void there only applies to the outer expression.)",
        },
        {
          selector:
            "CallExpression[callee.object.name='authClient'][callee.property.name='useSession']",
          message:
            "authClient.useSession() is a React hook (returns a cached signal value). Calling it inside an async callback is a Rules of Hooks violation and returns a stale value. For one-shot reads, use authClient.getSession() instead.",
        },
      ],
    },
  },
  // Reserved for future per-package overrides. Today the global warn@30
  // threshold already keeps `apps/cli/**` and `packages/contracts/**` clean
  // (their pre-existing code exceeds 15 but stays under 30).
  // Tighten these at the same cadence as the global rules when the debt is paid off.
]

export { config }
