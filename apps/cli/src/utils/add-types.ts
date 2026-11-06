import { z } from "zod"
import type { BlockDescriptorV1 } from "@workspace/registry/v1"
import type { PackageManagerInfo } from "./detect-pm.js"

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
export type AddBlockFile = {
  from: string
  contents: string
  to: { package: string; path: string }
}
export type BlockOutputPackage = {
  id: string
  path: string
}
export type BlockOutputReference = Pick<BlockOutputPackage, "id">
export type BlockOutputPath = Pick<BlockOutputPackage, "path">
export type PlannedBlockFile = Pick<AddBlockFile, "contents" | "to">
export type EnvironmentDeclaration = { name: string }
export type BlockState = {
  version: 1
  installations: Array<{
    name: string
    identity: string
    revision: string
    target: string
  }>
}
export type AddPlanWorkspaceContext = {
  cwd: string
  statePath: string
  packageManager: PackageManagerInfo
}
export type AddPlanTargetContext = {
  targetId: string
  targetPath: string
  targetManifest: PackageManifest
}
export type AddPlanBlockContext = {
  descriptor: BlockDescriptorV1
  files: AddBlockFile[]
}
export type AddPlanIdentityContext = {
  identity: string
  revision: string
  state: BlockState
}
export type CreateAddPlanArgs = AddPlanWorkspaceContext &
  AddPlanTargetContext &
  AddPlanBlockContext &
  AddPlanIdentityContext
export type CreateAddPlanResult = {
  writes: AddWrite[]
  manualSteps: string[]
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
