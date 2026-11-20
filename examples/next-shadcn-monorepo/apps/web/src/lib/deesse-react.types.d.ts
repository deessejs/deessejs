import type { usernameClient } from "better-auth/client/plugins"
import type { app } from "../server/app.js"

declare module "deesse/react" {
  interface DeesseReactRegistry {
    example: {
      router: typeof app.api.router
      authOptions: { plugins: [ReturnType<typeof usernameClient>] }
    }
  }
}

export {}
