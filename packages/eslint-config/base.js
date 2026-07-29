import js from "@eslint/js"
import tseslint from "typescript-eslint"

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**", "node_modules/**"],
  },
  {
    // Allow require() for @workspace/env/server since it must be loaded at runtime
    // to avoid ESM/build-time circular dependency issues with dotenv loading.
    rules: {
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["^@workspace/env/server$"] },
      ],
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
]

export { config }
