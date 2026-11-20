import type { app } from "../server/app.js"

declare module "deesse/react" {
  interface DeesseReactRegistry {
    example: {
      router: typeof app.api.router
    }
  }
}

export {}
