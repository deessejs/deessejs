/**
 * Public barrel.
 *
 * Re-exports the symbols consumers need:
 *
 *   - {@link ObjectStore}, {@link ObjectKey}, {@link ObjectMeta},
 *     {@link ObjectBody}: the storage abstraction interface and
 *     value types.
 *   - The four storage error classes.
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
} from "./object-store.js"

export {
  StorageError,
  StorageNotFoundError,
  StorageAuthError,
  StorageNetworkError,
} from "./errors.js"
