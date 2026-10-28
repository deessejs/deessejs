"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "@/hooks/use-sessions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

export function SessionsTable() {
  const { data: currentUserSession, isPending: sessionPending } =
    authClient.useSession()
  const userId = currentUserSession?.user.id
  const sessionsQuery = useSessions(userId)
  const revokeSession = useRevokeSession(userId)
  const revokeOtherSessions = useRevokeOtherSessions(userId)
  const sessions = sessionsQuery.data ?? []
  const loading =
    sessionPending || (userId !== undefined && sessionsQuery.isPending)
  const loadError =
    !sessionPending && !currentUserSession?.user
      ? "Your session is unavailable. Sign in again to view active sessions."
      : sessionsQuery.error?.message
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)
  function revokeSessionToken(token: (typeof sessions)[number]["token"]) {
    revokeSession.mutate(token, {
      onError: (error) => toast.error(error.message),
    })
  }

  function revokeOtherActiveSessions() {
    revokeOtherSessions.mutate(undefined, {
      onSuccess: () => setRevokeAllOpen(false),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !!loadError || revokeOtherSessions.isPending}
            >
              Sign out everywhere else
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign out of other sessions?</DialogTitle>
              <DialogDescription>
                You will be signed out of all other devices and browsers. Only
                your current session will remain active.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevokeAllOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={revokeOtherActiveSessions}
                disabled={revokeOtherSessions.isPending}
              >
                {revokeOtherSessions.isPending
                  ? "Signing out…"
                  : "Sign out everywhere"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2">
        {loading && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        )}
        {!loading && loadError && (
          <div role="alert" className="flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{loadError}</p>
            {sessionsQuery.isError && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void sessionsQuery.refetch()}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {!loading && !loadError && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No other active sessions.
          </p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{session.userAgent}</p>
                {session.isCurrent && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress} · Expires{" "}
                {new Date(session.expiresAt).toLocaleDateString()}
              </p>
            </div>
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSessionToken(session.token)}
                disabled={
                  loading ||
                  !!loadError ||
                  revokeSession.isPending ||
                  revokeOtherSessions.isPending
                }
              >
                {revokeSession.isPending &&
                revokeSession.variables === session.token
                  ? "Signing out…"
                  : "Sign out"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
