// Public surface of the router. Importers should use this file
// rather than reaching into sub-dirs. Sub-dirs (`procedures/`,
// `routes/`) are implementation details; their internal layout
// can change without breaking external consumers.
export { mountRpc } from "./procedures/mount.js"
export { mountHttp } from "./routes/http.js"
export { appRouter, type AppRouter } from "./routes/index.js"
