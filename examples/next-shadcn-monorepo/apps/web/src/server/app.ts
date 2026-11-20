import { createDeesse } from "deesse"
import { authOptions } from "../../auth.config.js"
import { deesseConfig } from "../../deesse.config.js"
import { database } from "./database.js"

export const app = createDeesse({
  database,
  auth: authOptions,
  ...deesseConfig,
})
