/**
 * Public barrel.
 *
 * Re-exports the symbols consumers need:
 *
 *   - {@link ObjectStore}, {@link ObjectKey}, {@link ObjectMeta},
 *     {@link ObjectBody}: the storage abstraction types.
 *   - {@link StorageFailure}: the discriminated union of every
 *     failure this package can produce.
 *   - {@link toStorageError}, {@link asStorageFailure}: helpers to
 *     throw and unwrap a {@link StorageFailure} as a regular
 *     `Error` (preserving the failure on `.cause`).
 *
 * Provider implementations are NOT re-exported here. Consumers
 * import them explicitly (`@workspace/storage/providers/local-fs`,
 * `@workspace/storage/providers/r2`) at the call site. This keeps
 * tree-shaking declarative.
 *
 * Nothing about templates, descriptors, JSON, Zod, or namespaces
 * belongs here. This barrel is the bytes layer.
 */

export type {
  ObjectStore,
  ObjectKey,
  ObjectMeta,
  ObjectBody,
  StorageFailure,
} from "./object-store.js"

export { toStorageError, asStorageFailure } from "./object-store.js"
