import { unsupportedManager } from "../errors/index.js"

/**
 * Detect npm-spawned invocations and abort with `unsupported_manager`
 * BEFORE any FS or network side-effect.
 *
 * Three env vars are checked because npm sets all three in slightly
 * different conditions:
 *
 *   - `npm_config_user_agent` — set on every `npm exec` / `npx` invocation.
 *     Format: `npm/10.4.0 node/v22.10.0 ...`. Match: prefix `npm/`.
 *   - `npm_lifecycle_event` — set when invoked via `npm run <script>`.
 *   - `npm_node_execpath` — set by npm-spawned processes.
 *
 * If any of these is present, the invocation is npm-mediated and this
 * increment refuses to proceed. Tested against real `npx` and `npm exec`
 * invocations (see test/unit/detect-invoker.test.ts).
 */
const isNpmUserAgent = (value: string | undefined): boolean =>
  typeof value === "string" && value.startsWith("npm/")

const isSetAndNonEmpty = (value: string | undefined): boolean =>
  typeof value === "string" && value.length > 0

export const assertNotNpmInvocation = (
  env: NodeJS.ProcessEnv = process.env,
): void => {
  if (
    isNpmUserAgent(env.npm_config_user_agent) ||
    isSetAndNonEmpty(env.npm_lifecycle_event) ||
    isSetAndNonEmpty(env.npm_node_execpath)
  ) {
    throw unsupportedManager("npm")
  }
}
