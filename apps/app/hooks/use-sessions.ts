"use client"

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  asCurrentSessionToken,
  asSessionToken,
  type CurrentSessionToken,
  type SessionToken,
} from "@workspace/auth/types"
import { authClient } from "@/lib/auth-client"

interface AccountSession {
  id: string
  token: SessionToken
  userAgent: string
  ipAddress: string
  expiresAt: Date
  isCurrent: boolean
}

const sessionQueryKeys = {
  all: ["settings", "sessions"] as const,
  list: (userId: string | undefined) =>
    [...sessionQueryKeys.all, userId] as const,
}

async function fetchSessions(): Promise<AccountSession[]> {
  const [sessionsResponse, currentSessionResponse] = await Promise.all([
    authClient.listSessions(),
    authClient.getSession(),
  ])

  if (sessionsResponse.error) {
    throw new Error(sessionsResponse.error.message ?? "Failed to load sessions")
  }
  if (currentSessionResponse.error) {
    throw new Error(
      currentSessionResponse.error.message ?? "Failed to load current session"
    )
  }

  const sessions = sessionsResponse.data
  const currentSession = currentSessionResponse.data
  const currentTokenValue = currentSession?.session?.token
  if (!sessions || !currentTokenValue) {
    throw new Error("Session response did not include the current session")
  }

  const currentToken: CurrentSessionToken =
    asCurrentSessionToken(currentTokenValue)

  return sessions.map((session) => ({
    id: session.id,
    token: asSessionToken(session.token),
    userAgent: session.userAgent ?? "Unknown",
    ipAddress: session.ipAddress ?? "Unknown",
    expiresAt: session.expiresAt,
    isCurrent: session.token === currentToken,
  }))
}

function sessionsQueryOptions(userId: string | undefined) {
  return queryOptions({
    queryKey: sessionQueryKeys.list(userId),
    queryFn: fetchSessions,
    enabled: userId !== undefined,
  })
}

export function useSessions(userId: string | undefined) {
  return useQuery(sessionsQueryOptions(userId))
}

export function useRevokeSession(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: SessionToken) => {
      const { error } = await authClient.revokeSession({ token })
      if (error) {
        throw new Error(error.message ?? "Failed to revoke session")
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: sessionsQueryOptions(userId).queryKey,
      }),
  })
}

export function useRevokeOtherSessions(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions()
      if (error) {
        throw new Error(error.message ?? "Failed to sign out other sessions")
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: sessionsQueryOptions(userId).queryKey,
      }),
  })
}
