import { createHash } from "node:crypto"
import { MAX_MANAGED_ARCHIVE_BYTES } from "@workspace/registry/v1"

export async function downloadManagedArchive(url: string, expectedDigest: string): Promise<Uint8Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Managed release download returned HTTP ${response.status}.`)
  const length = Number(response.headers.get("content-length"))
  if (Number.isFinite(length) && length > MAX_MANAGED_ARCHIVE_BYTES) throw new Error("Managed release archive exceeds 100 MiB.")
  if (!response.body) throw new Error("Managed release download returned an empty response.")
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_MANAGED_ARCHIVE_BYTES) {
        await reader.cancel()
        throw new Error("Managed release archive exceeds 100 MiB.")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const archive = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { archive.set(chunk, offset); offset += chunk.byteLength }
  const actualDigest = createHash("sha256").update(archive).digest("hex")
  if (actualDigest !== expectedDigest) throw new Error("Managed release archive digest did not match its release record.")
  return archive
}
