import { type ServerEnv } from "./schema.js";
declare function getServerEnv(): Readonly<ServerEnv>;
/**
 * Lazy server env. Validation fires on first property access, not at
 * import time. This preserves the existing contract used by:
 *
 *   - vitest config (`setupFiles: ["@workspace/env/server"]`)
 *   - drizzle-kit (`drizzle.config.ts`)
 *   - the `require("@workspace/env/server")` path in
 *     `packages/database/src/client.ts`
 *   - the side-effect-only `import "@workspace/env/server"` form
 *
 * Migration entry point for callers that want explicit control:
 *   import { getServerEnv } from "@workspace/env/server"
 *   const env = getServerEnv()
 */
export declare const serverEnv: Readonly<ServerEnv>;
export { getServerEnv };
//# sourceMappingURL=server.d.ts.map