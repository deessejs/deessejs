import { test as base } from "vitest"

import { startStack, type StartedStack } from "./containers.js"

/**
 * Vitest fixture for the disposable docker stack (network +
 * Verdaccio + PostgreSQL). The fixture owns the lifecycle: the
 * stack is started before the test, the test is given a live
 * StartedStack, and the stack is stopped in a finally block
 * whether the test passed, threw, or timed out. The cleanup
 * errors are logged via console.warn inside stack.stop() so a
 * leak on a passing test still surfaces in the report.
 *
 * This replaces the `let stack: StartedStack | null = null`
 * pattern that was previously inlined in every e2e test file.
 * With a fixture, the test destructures `{ stack }` from its
 * context; the type system guarantees stack is defined and
 * non-null inside the test body, and there is no chance of
 * an afterAll firing against a half-initialised stack.
 */
export const test = base.extend<{ stack: StartedStack }>({
  stack: async (_taskContext, use) => {
    const stack = await startStack()
    try {
      await use(stack)
    } finally {
      // The fixture holds the only strong reference to the
      // stack. The afterAll-style finally will fire on
      // assertion failure, timeout, or setup error. The
      // teardown itself logs (does not throw) so a leaked
      // container on a passing test still shows up in the
      // CI report without masking the test's outcome.
      await stack.stop()
    }
  },
})

export { expect } from "vitest"
