import { createR2Storage } from "@workspace/storage"
import { serverEnv } from "@workspace/env/server"

type ReleaseStores = { staging: ReturnType<typeof createR2Storage>; sealed: ReturnType<typeof createR2Storage> }
let stores: ReleaseStores | undefined
let injectedStores: ReleaseStores | undefined

function requireStorageValue(value: string | undefined): string {
  if (!value) throw new Error("Managed template release storage is not configured.")
  return value
}

/** Test seam for an isolated fake object store. Never configure from a client request. */
export function setManagedReleaseStorageForTests(value: ReleaseStores | undefined): void {
  injectedStores = value
}

export function getManagedReleaseStorage(): ReleaseStores {
  if (injectedStores) return injectedStores
  if (stores) return stores
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_REGION, R2_TEMPLATE_RELEASES_BUCKET, R2_TEMPLATE_RELEASES_STAGING_BUCKET } = serverEnv
  const accountId = requireStorageValue(R2_ACCOUNT_ID)
  const accessKeyId = requireStorageValue(R2_ACCESS_KEY_ID)
  const secretAccessKey = requireStorageValue(R2_SECRET_ACCESS_KEY)
  const sealedBucket = requireStorageValue(R2_TEMPLATE_RELEASES_BUCKET)
  const stagingBucket = requireStorageValue(R2_TEMPLATE_RELEASES_STAGING_BUCKET)
  const common = { accountId, accessKeyId, secretAccessKey, ...(R2_ENDPOINT ? { endpoint: R2_ENDPOINT } : {}), ...(R2_REGION ? { region: R2_REGION } : {}) }
  stores = {
    staging: createR2Storage({ ...common, bucket: stagingBucket }),
    sealed: createR2Storage({ ...common, bucket: sealedBucket }),
  }
  return stores
}
