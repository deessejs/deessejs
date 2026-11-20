import { betterAuth } from "better-auth"
import "dotenv/config"

export const authOptions = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "local-only-deesse-next-example-secret",
  emailAndPassword: { enabled: true },
}

export const auth = betterAuth(authOptions)
