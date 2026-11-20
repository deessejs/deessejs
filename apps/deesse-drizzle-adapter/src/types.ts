import type { DeesseDatabaseAdapter, DeesseDatabaseSchema } from "deesse"

export type DrizzleAdapter<TSchema extends DeesseDatabaseSchema> = DeesseDatabaseAdapter<TSchema>
