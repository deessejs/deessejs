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

type AccountSession = NonNullable<ReturnType<typeof useSessions>["data"]>[number]

function RevokeOtherSessionsDialog({
  open,
  pending,
  disabled,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  pending: boolean
  disabled: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <div className="flex justify-end">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? "Signing out…" : "Sign out everywhere"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SessionsStatus({
  loading,
  error,
  hasSessions,
  canRetry,
  onRetry,
}: {
  loading: boolean
  error: string | undefined
  hasSessions: boolean
  canRetry: boolean
  onRetry: () => void
}) {
  if (loading && !hasSessions) {
    return (
      <p className="text-sm text-muted-foreground">Loading sessions…</p>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3">
        <p className="text-sm text-destructive">{error}</p>
        {canRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (!loading && !hasSessions) {
    return (
      <p className="text-sm text-muted-foreground">
        No other active sessions.
      </p>
    )
  }

  return null
}

function SessionRow({
  session,
  disabled,
  signingOut,
  onRevoke,
}: {
  session: AccountSession
  disabled: boolean
  signingOut: boolean
  onRevoke: (token: AccountSession["token"]) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
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
          onClick={() => onRevoke(session.token)}
          disabled={disabled}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      )}
    </div>
  )
}

function SessionsList({
  sessions,
  disabled,
  revokingToken,
  onRevoke,
}: {
  sessions: AccountSession[]
  disabled: boolean
  revokingToken: AccountSession["token"] | undefined
  onRevoke: (token: AccountSession["token"]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          disabled={disabled}
          signingOut={revokingToken === session.token}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  )
}

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

  function revokeSessionToken(token: AccountSession["token"]) {
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

  const actionsDisabled =
    loading || loadError !== undefined || revokeOtherSessions.isPending

  return (
    <div className="flex flex-col gap-4">
      <RevokeOtherSessionsDialog
        open={revokeAllOpen}
        pending={revokeOtherSessions.isPending}
        disabled={actionsDisabled}
        onOpenChange={setRevokeAllOpen}
        onConfirm={revokeOtherActiveSessions}
      />
      <div className="flex flex-col gap-2">
        <SessionsStatus
          loading={loading}
          error={loadError}
          hasSessions={sessions.length > 0}
          canRetry={sessionsQuery.isError}
          onRetry={() => void sessionsQuery.refetch()}
        />
        {sessions.length > 0 && (
          <SessionsList
            sessions={sessions}
            disabled={
              actionsDisabled ||
              revokeSession.isPending ||
              revokeOtherSessions.isPending
            }
            revokingToken={
              revokeSession.isPending ? revokeSession.variables : undefined
            }
            onRevoke={revokeSessionToken}
          />
        )}
      </div>
    </div>
  )
}
