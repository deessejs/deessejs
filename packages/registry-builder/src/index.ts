/**
 * Public surface of `@workspace/registry-builder`.
 *
 * Authors import `defineTemplate` from this barrel; the build
 * pipeline + the helper API are exposed for tests and the CLI.
 */

export { defineTemplate } from "./types.js"
export type {
  AuthorTemplateConfig,
  AuthorPrompt,
  AuthorFiles,
} from "./types.js"

export { build, buildToString } from "./build.js"
export type { BuildOptions } from "./build.js"

export { matchGlob, matchAnyGlob, includeExclude, globToRegExp } from "./glob.js"
export { inferFileType } from "./type-inference.js"
export type { InferredFileType } from "./type-inference.js"