/**
 * Re-export the extension default so consumers can import it directly
 * without running `eve extension build`. When `eve extension build` runs
 * it overwrites this file with a generated mount factory — see
 * docs/extensions for the full pipeline.
 */
export { default } from "../extension/extension.js"