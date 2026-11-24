import { betterAuth } from "better-auth"

export const auth = betterAuth({
  baseURL: "http://localhost",
  secret: "deesse-postgres-integration-secret-long-enough",
  emailAndPassword: { enabled: true },
})
