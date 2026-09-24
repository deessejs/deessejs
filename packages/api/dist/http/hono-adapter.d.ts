import type { Context } from "hono";
/**
 * Wrap `c.req.raw` in a Proxy that delegates body-parser methods
 * to Hono's parsed getters. Pass the result to
 * `RPCHandler.handle(...)` so the body stays consumable.
 */
export declare const wrapForOrpc: (c: Context) => Request;
//# sourceMappingURL=hono-adapter.d.ts.map