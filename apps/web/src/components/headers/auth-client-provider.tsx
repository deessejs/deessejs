"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { createAuthClientFor } from "@/lib/auth-client"

/**
 * React Context that hands the auth client down the tree. The
 * client is constructed lazily with the `apiBaseUrl` the Server
 * Component resolved via `withRelatedProject`; consumers in
 * descendant Client Components read it via `useAuthClient()`
 * without ever calling the factory themselves. This is the
 * single entry point through which the server-resolved URL
 * enters the browser bundle.
 */

type AuthClient = ReturnType<typeof createAuthClientFor>

const AuthClientContext = createContext<AuthClient | null>(null)

export function AuthClientProvider({
  apiBaseUrl,
  children,
}: {
  apiBaseUrl: string
  children: ReactNode
}) {
  // useMemo: build the client once per `apiBaseUrl`. The client
  // holds internal state (session cookie cache) that should not
  // be recreated on every render.
  const client = useMemo(() => createAuthClientFor(apiBaseUrl), [apiBaseUrl])
  return (
    <AuthClientContext.Provider value={client}>
      {children}
    </AuthClientContext.Provider>
  )
}

export function useAuthClient(): AuthClient {
  const ctx = useContext(AuthClientContext)
  if (!ctx) {
    throw new Error(
      "useAuthClient() must be called inside <AuthClientProvider>. " +
        "Wrap your component in <UserMenuServer> or another provider.",
    )
  }
  return ctx
}