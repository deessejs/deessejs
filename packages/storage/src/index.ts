/**
 * Public barrel.
 *
 * Re-exports the surface that other packages can depend on. Provider
 * implementations are NOT re-exported here — consumers import them
 * explicitly (`@workspace/storage/providers/git-tags`) for tree
 * shaking.
 */

export type {
  ParsedDescriptor,
  DescriptorProvider,
  BranchableDescriptorProvider,
  BranchHandle,
  AuthenticatedDescriptorProvider,
} from "./provider.js"

export {
  StorageError,
  StorageNotFoundError,
  StorageAuthError,
  StorageCacheMissError,
  StorageNetworkError,
  StorageOfflineViolationError,
  StorageInvalidDescriptorError,
} from "./errors.js"

export { WireEnvelope, type WireEnvelope as WireEnvelopeType } from "./envelope.js"

export {
  DEFAULT_BASE,
  LATEST,
  parseRef,
  refToString,
  catalogueUrl,
  itemUrl,
  latestUrl,
  type Ref,
} from "./resolve.js"

export { detectOffline, type OfflineContext } from "./offline.js"

export {
  read as readCache,
  write as writeCache,
  purge as purgeCache,
  purgeProvider as purgeProviderCache,
  readCatalogue,
  writeCatalogue,
  descriptorCachePath,
  httpCacheKey,
  type CachedDescriptor,
  type CachedCatalogue,
  type ProviderId,
} from "./cache.js"
