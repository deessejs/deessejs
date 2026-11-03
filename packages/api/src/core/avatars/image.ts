import sharp from "sharp"

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MAX_EDGE = 4096
export const AVATAR_MAX_PIXELS = 16_000_000
export const AVATAR_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

const inputFormats = new Map<string, (typeof AVATAR_INPUT_TYPES)[number]>([
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
])

export class InvalidAvatarError extends Error {}

/** Fully decodes untrusted input, then returns metadata-free WebP bytes. */
export async function normalizeAvatar(
  input: Buffer,
  declaredContentType: string
): Promise<Buffer> {
  try {
    const image = sharp(input, {
      failOn: "warning",
      limitInputPixels: AVATAR_MAX_PIXELS,
      pages: 1,
    })
    const metadata = await image.metadata()
    const actualContentType = metadata.format
      ? inputFormats.get(metadata.format)
      : undefined

    if (!actualContentType || actualContentType !== declaredContentType) {
      throw new InvalidAvatarError("Unsupported avatar image.")
    }
    if ((metadata.pages ?? 1) !== 1) {
      throw new InvalidAvatarError("Animated images are not supported.")
    }
    if (!metadata.width || !metadata.height) {
      throw new InvalidAvatarError("Unsupported avatar dimensions.")
    }
    if (metadata.width > AVATAR_MAX_EDGE || metadata.height > AVATAR_MAX_EDGE) {
      throw new InvalidAvatarError("Avatar image is too large.")
    }
    if (metadata.width * metadata.height > AVATAR_MAX_PIXELS) {
      throw new InvalidAvatarError("Avatar image is too large.")
    }

    const output = await image.autoOrient().webp().toBuffer()
    if (output.byteLength === 0 || output.byteLength > AVATAR_MAX_BYTES) {
      throw new InvalidAvatarError("Avatar image exceeds the size limit.")
    }
    return output
  } catch (error) {
    if (error instanceof InvalidAvatarError) throw error
    throw new InvalidAvatarError("Unsupported avatar image.")
  }
}
