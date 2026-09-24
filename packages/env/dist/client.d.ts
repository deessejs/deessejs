import { type ClientEnv } from "./schema.js";
/**
 * Eager-validated client env. Validation fires at module load. The
 * Proxy returned by `createEnv` enforces the client/server boundary
 * on every property access (`onInvalidAccess`).
 */
export declare const clientEnv: Readonly<ClientEnv>;
/**
 * Ergonomic URL helpers (ADR-021 §"What this rule allows" §4 + ADR-029
 * Decision #6 follow-up). Each helper returns the role-specific origin
 * as a string. Callers compose with `new URL(path, helper)` rather
 * than concatenating — trailing-slash safety comes from `new URL`.
 *
 * Naming convention: the helper is named after the **role**, not the
 * variable. `webURL()` returns the marketing origin
 * (`deessejs.com` in prod), `appURL()` returns the apps/app origin
 * (`app.deessejs.com` in prod). Each role maps to exactly one env
 * var; aliasing across roles is forbidden (ADR-029 Decision #1).
 */
export declare function webURL(): string;
export declare function appURL(): string;
export declare function docsURL(): string;
export declare function apiBaseURL(): string;
//# sourceMappingURL=client.d.ts.map