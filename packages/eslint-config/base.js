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
      // Phase 1 starts at warn@15 — the default from sonarjs.configs.recommended.
      // Phase 4 (target) is warn@10/error@20. See docs/engineering/complexity-rollout.md.
      "sonarjs/cognitive-complexity": [
        "warn",
        15,
      ],
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-nested-switch": "error",

      // Phase 0 — SonarJS recommended config is fully enabled below. The two
      // rules below were being flagged against existing security-test fixtures
      // (`packages/utils/tests/safe-redirect.test.ts` exercises http /
      // javascript: prefixes on purpose). Re-enable them in a focused follow-up
      // once those fixtures are updated.
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/code-eval": "off",
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
  // Relaxed scope for generated / schema-heavy code where cognitive complexity
  // is high by design (Zod unions, CLI dispatch tables). They still warn so
  // authors see when they're above target, but never block PRs.
  // Tighten these at the same cadence as the global rules when the debt is paid off.
  {
    files: [
      "apps/cli/**/*.{ts,tsx}",
      "packages/contracts/**/*.{ts,tsx}",
    ],
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 30],
    },
  },
]

export { config }
