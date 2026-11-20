import { createDeesse } from "deesse"
import { authOptions } from "../../auth.config.ts"
import { deesseConfig } from "../../deesse.config.ts"
import { database } from "./database.ts"

export const app = createDeesse({
  database,
  auth: authOptions,
  ...deesseConfig,
})
