/**
 * Public barrel for `@workspace/registry-client`.
 *
 * Re-exports the symbols consumers need:
 *
 *   - {@link createRegistryClient}: factory for the SDK.
 *   - {@link RegistryClient}: the interface every client implements.
 *   - Public types: {@link TemplateV2}, {@link FetchedTemplate},
 *     {@link CatalogEntry}, {@link FetchOptions}, {@link Result}.
 *   - Public helpers: {@link ok}, {@link err}, {@link toRegistryError},
 *     {@link asRegistryFailure}.
 *
 * Internal helpers (the HTTP client, parser, etc.) are NOT exported.
 * Consumers should never need to touch them.
 *
 * Nothing about templates-as-bytes, Zod schemas, or transport
 * details belongs here. This barrel is the consumer surface.
 */

export { createRegistryClient } from "./registry.js"

export type {
  CatalogEntry,
  FetchOptions,
  FetchedTemplate,
  ObjectKey,
  RegistryClient,
  RegistryClientOptions,
  RegistryFailure,
  Result,
  TemplateV2,
} from "./types.js"

export { ok, err } from "./types.js"

export { asRegistryFailure, toRegistryError } from "./errors.js"
