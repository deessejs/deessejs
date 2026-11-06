import { z } from "zod"

export type AddOptions = {
  target: string
  ref?: string
  dryRun?: boolean
  install?: boolean
}
export type PackageManifest = {
  name: string
  dependencies?: Record<string, string> | undefined
  devDependencies?: Record<string, string> | undefined
  optionalDependencies?: Record<string, string> | undefined
  [key: string]: unknown
}
export type AddWrite = {
  path: string
  contents: Uint8Array
  previous?: Uint8Array
}
export type BlockState = {
  version: 1
  installations: Array<{
    name: string
    identity: string
    revision: string
    target: string
  }>
}
export const PackageManifestSchema = z
  .object({
    name: z.string().min(1),
    dependencies: z.record(z.string(), z.string()).optional(),
    devDependencies: z.record(z.string(), z.string()).optional(),
    optionalDependencies: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()
export const BlockStateSchema = z.strictObject({
  version: z.literal(1),
  installations: z.array(
    z.strictObject({
      name: z.string(),
      identity: z.string(),
      revision: z.string(),
      target: z.string(),
    })
  ),
})
