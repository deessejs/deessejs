/**
 * The stub the Vitest alias for `server-only` points at.
 *
 * `server-only` is a marker with no runtime behaviour: Next.js
 * implements it at the compiler level, and the ambient module
 * declaration ships with Next's own types. The package is not a
 * dependency of this workspace, so a plain Node test runner cannot
 * resolve the import on its own.
 *
 * Aliasing it to an empty module keeps the marker in the source, where
 * it belongs, and keeps the tests running outside a React Server
 * Component graph.
 */
export {}
