"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
  useLinkedAccounts,
  useUnlinkAccount,
} from "@/hooks/use-linked-accounts"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { GoogleIcon } from "@/components/auth/icons/google-icon"
import { GitHubIcon } from "@/components/auth/icons/github-icon"

const PROVIDER_INFO: Record<
  string,
  { name: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  google: { name: "Google", Icon: GoogleIcon },
  github: { name: "GitHub", Icon: GitHubIcon },
}

export function ConnectedAccountsList() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const userId = session?.user.id
  const accountsQuery = useLinkedAccounts(userId)
  const unlinkAccount = useUnlinkAccount(userId)
  const accounts = accountsQuery.data ?? []
  const loading =
    sessionPending || (userId !== undefined && accountsQuery.isPending)
  const loadError =
    !sessionPending && !session?.user
      ? "Your session is unavailable. Sign in again to view linked accounts."
      : accountsQuery.error?.message
  const [unlinkConfirm, setUnlinkConfirm] = useState<{
    id: string
    provider: string
  } | null>(null)
  const [linking, setLinking] = useState<string | null>(null)

  async function startAccountLink(provider: string) {
    setLinking(provider)
    try {
      await authClient.linkSocial({ provider })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to link account"
      toast.error(message)
    } finally {
      setLinking(null)
    }
  }

  function unlinkConfirmedAccount() {
    if (!unlinkConfirm) return
    unlinkAccount.mutate(unlinkConfirm.id, {
      onSuccess: () => setUnlinkConfirm(null),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {loading && accounts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Loading linked accounts…
        </p>
      )}
      {!loading && loadError && (
        <div role="alert" className="flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">{loadError}</p>
          {accountsQuery.isError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void accountsQuery.refetch()}
            >
              Retry
            </Button>
          )}
        </div>
      )}
      {!loading && !loadError && accounts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Linked accounts</p>
          {accounts.map((account) => {
            const info = PROVIDER_INFO[account.providerId] ?? {
              name: account.providerId,
              Icon: () => (
                <span className="text-xs font-bold">
                  {account.providerId.slice(0, 2).toUpperCase()}
                </span>
              ),
            }
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
                    <info.Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{info.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.accountId}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setUnlinkConfirm({
                      id: account.id,
                      provider: account.providerId,
                    })
                  }
                  disabled={
                    unlinkAccount.isPending &&
                    unlinkAccount.variables === account.id
                  }
                >
                  {unlinkAccount.isPending &&
                  unlinkAccount.variables === account.id
                    ? "Unlinking…"
                    : "Unlink"}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Link a new account</p>
        <div className="flex gap-2">
          {(["google", "github"] as const).map((provider) => {
            const isLinked = accounts.some((a) => a.providerId === provider)
            const info = PROVIDER_INFO[provider]
            return (
              <Button
                key={provider}
                variant="outline"
                size="sm"
                onClick={() => startAccountLink(provider)}
                disabled={
                  loading || !!loadError || isLinked || linking === provider
                }
              >
                {linking === provider
                  ? "Linking…"
                  : `Link ${info?.name ?? provider}`}
              </Button>
            )
          })}
        </div>
      </div>

      <Dialog
        open={!!unlinkConfirm}
        onOpenChange={(open) => !open && setUnlinkConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Unlink{" "}
              {unlinkConfirm
                ? (PROVIDER_INFO[unlinkConfirm.provider]?.name ??
                  unlinkConfirm.provider)
                : ""}
              ?
            </DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in with this account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlinkConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={unlinkConfirmedAccount}
              disabled={unlinkAccount.isPending}
            >
              {unlinkAccount.isPending ? "Unlinking…" : "Unlink"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
