import { randomUUID } from "node:crypto"
import { createR2Storage } from "@workspace/storage"
import { serverEnv } from "@workspace/env/server"

let storage: ReturnType<typeof createR2Storage> | undefined

export function getAvatarStorage() {
  if (storage) return storage

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_AVATARS_BUCKET,
  } = serverEnv
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_AVATARS_BUCKET
  ) {
    throw new Error("Avatar object storage is not configured.")
  }

  storage = createR2Storage({
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_AVATARS_BUCKET,
  })
  return storage
}

export const createAvatarKeys = () => {
  const id = randomUUID()
  return {
    stagedKey: `avatars/staging/${id}`,
    objectKey: `avatars/final/${id}.webp`,
  }
}
