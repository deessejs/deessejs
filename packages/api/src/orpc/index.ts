// Public surface of the orpc layer. Importers should use this file
// rather than reaching into sub-dirs. The oRPC builder, types, and
// guards are the public contract; the routes are internal.
export { base } from "./base.js"
export type { BaseContext } from "./base-context.js"
export { authGuard } from "./auth-middleware.js"
export { appRouter, type AppRouter } from "./routes/app-router.js"
