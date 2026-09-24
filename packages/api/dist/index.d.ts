import { API_BASE_PATH, API_RPC_PATH, API_AUTH_PATH } from "./constants/base-path.js";
import { type ApiEnv } from "./http/index.js";
import { appRouter, type AppRouter } from "./orpc/index.js";
declare const api: import("hono/hono-base").HonoBase<ApiEnv, import("hono/types").BlankSchema, "/api/v1", "/api/v1">;
export { api };
export { appRouter, type AppRouter };
export { API_RPC_PATH, API_AUTH_PATH, API_BASE_PATH };
//# sourceMappingURL=index.d.ts.map