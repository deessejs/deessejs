// Public surface of the core layer. Importers should use this file
// rather than reaching into sub-dirs. Sub-dirs (`github/`, `templates/`)
// are independent sub-domains; their internal layout can change
// without breaking external consumers.
export * as github from "./github/index.js"
export * as templates from "./templates/index.js"
