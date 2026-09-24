import type { Hono } from "hono";
import type { ApiEnv } from "../env.js";
/**
 * Direct HTTP routes that do not go through oRPC:
 *   - `GET /health`    — liveness probe, no dependencies.
 *   - `GET /version`   — server version probe. Cached aggressively.
 *   - `GET /ready`     — readiness probe, pings Postgres.
 *   - `*  /auth/*`     — Better Auth handler (login, signup, ...).
 *
 * The oRPC router handles everything under `/rpc/*`. Adding a new
 * direct HTTP route is a deliberate choice (a non-RPC endpoint);
 * most things belong in `routes/templates.ts` and friends.
 */
export declare const mountHttp: (api: Hono<ApiEnv>) => void;
//# sourceMappingURL=http.d.ts.map