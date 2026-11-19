"use client"

import { client } from "@/lib/client"
import { queryOptions, useQuery } from "@tanstack/react-query"

export type OAuthClientDisplay = {
  client_name?: string
  client_uri?: string
  tos_uri?: string
  policy_uri?: string
}

export type ConsentRequest = {
  clientId: string
  redirectHost: string
  resource: string
  scopes: string[]
}

type ParsedConsentRequest = {
  request: ConsentRequest | null
  error: string | null
}

function parseConsentRequest(params: URLSearchParams): ParsedConsentRequest {
  const signedNames = new Set(params.getAll("ba_param"))
  const clientId = params.get("client_id")
  const redirectUri = params.get("redirect_uri")
  const resource = params.get("resource")
  const requiredNames = ["client_id", "redirect_uri", "resource"]
  const missingSignedParameter = requiredNames.some(
    (name) => !params.has(name) || !signedNames.has(name)
  )
  const unsignedScope = params.has("scope") && !signedNames.has("scope")
  const incompleteRequest = {
    request: null,
    error:
      "This authorization request is incomplete. Start the connection again from your app.",
  } satisfies ParsedConsentRequest

  if (clientId === null) return incompleteRequest
  if (redirectUri === null) return incompleteRequest
  if (resource === null) return incompleteRequest
  if (missingSignedParameter || unsignedScope) return incompleteRequest

  try {
    const scopes = (params.get("scope") ?? "").split(/\s+/).filter(Boolean)
    return {
      request: {
        clientId,
        redirectHost: new URL(redirectUri).host,
        resource,
        scopes,
      },
      error: null,
    }
  } catch {
    return {
      request: null,
      error: "This authorization request has an invalid return address.",
    }
  }
}

function oauthClientQueryOptions(clientId: string | undefined) {
  return queryOptions({
    queryKey: ["oauth", "prelogin-client", clientId] as const,
    enabled: clientId !== undefined,
    retry: false,
    queryFn: async () => {
      if (!clientId) throw new Error("Missing OAuth client ID")
      const { data, error } = await client.auth.oauth2.publicClientPrelogin({
        client_id: clientId,
      })
      if (error || !data) {
        throw new Error(
          "We could not verify the requesting app. Restart the connection from your app."
        )
      }
      return data as OAuthClientDisplay
    },
  })
}

export function useOAuthConsentRequest(search: string) {
  const parsed = parseConsentRequest(new URLSearchParams(search))
  const clientQuery = useQuery(
    oauthClientQueryOptions(parsed.request?.clientId)
  )

  return {
    request: parsed.request,
    oauthClient: clientQuery.data ?? null,
    error:
      parsed.error ??
      (clientQuery.error instanceof Error ? clientQuery.error.message : null),
    isLoading: parsed.request !== null && clientQuery.isPending,
  }
}
