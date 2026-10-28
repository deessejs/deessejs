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

interface LinkedAccount {
  id: string
  providerId: string
  accountId: string
}

interface UnlinkConfirmation {
  id: string
  provider: string
}

const PROVIDER_INFO: Record<
  string,
  { name: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  google: { name: "Google", Icon: GoogleIcon },
  github: { name: "GitHub", Icon: GitHubIcon },
}

const LINKABLE_PROVIDERS = ["google", "github"] as const

function LinkedAccountsStatus({
  loading,
  error,
  canRetry,
  onRetry,
}: {
  loading: boolean
  error: string | undefined
  canRetry: boolean
  onRetry: () => void
}) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading linked accounts…
      </p>
    )
  }

  if (!error) return null

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

function LinkedAccountRow({
  account,
  isUnlinking,
  onUnlink,
}: {
  account: LinkedAccount
  isUnlinking: boolean
  onUnlink: (account: LinkedAccount) => void
}) {
  const info = PROVIDER_INFO[account.providerId]
  const ProviderIcon = info?.Icon
  const providerName = info?.name ?? account.providerId

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
          {ProviderIcon ? (
            <ProviderIcon className="size-4" />
          ) : (
            <span className="text-xs font-bold">
              {account.providerId.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{providerName}</p>
          <p className="text-xs text-muted-foreground">{account.accountId}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onUnlink(account)}
        disabled={isUnlinking}
      >
        {isUnlinking ? "Unlinking…" : "Unlink"}
      </Button>
    </div>
  )
}

function LinkedAccountsListItems({
  accounts,
  unlinkingId,
  onUnlink,
}: {
  accounts: LinkedAccount[]
  unlinkingId: string | undefined
  onUnlink: (account: LinkedAccount) => void
}) {
  if (accounts.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Linked accounts</p>
      {accounts.map((account) => (
        <LinkedAccountRow
          key={account.id}
          account={account}
          isUnlinking={unlinkingId === account.id}
          onUnlink={onUnlink}
        />
      ))}
    </div>
  )
}

function LinkAccountButtons({
  accounts,
  disabled,
  linkingProvider,
  onLink,
}: {
  accounts: LinkedAccount[]
  disabled: boolean
  linkingProvider: string | null
  onLink: (provider: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Link a new account</p>
      <div className="flex gap-2">
        {LINKABLE_PROVIDERS.map((provider) => {
          const isLinked = accounts.some(
            (account) => account.providerId === provider
          )
          const info = PROVIDER_INFO[provider]

          return (
            <Button
              key={provider}
              variant="outline"
              size="sm"
              onClick={() => onLink(provider)}
              disabled={disabled || isLinked || linkingProvider === provider}
            >
              {linkingProvider === provider
                ? "Linking…"
                : `Link ${info.name}`}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function UnlinkAccountDialog({
  confirmation,
  pending,
  onClose,
  onConfirm,
}: {
  confirmation: UnlinkConfirmation | null
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const providerName = confirmation
    ? (PROVIDER_INFO[confirmation.provider]?.name ?? confirmation.provider)
    : ""

  return (
    <Dialog open={confirmation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink {providerName}?</DialogTitle>
          <DialogDescription>
            You will no longer be able to sign in with this account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Unlinking…" : "Unlink"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
  const [unlinkConfirm, setUnlinkConfirm] =
    useState<UnlinkConfirmation | null>(null)
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
      <LinkedAccountsStatus
        loading={loading && accounts.length === 0}
        error={!loading ? loadError : undefined}
        canRetry={accountsQuery.isError}
        onRetry={() => void accountsQuery.refetch()}
      />
      {!loading && !loadError && (
        <LinkedAccountsListItems
          accounts={accounts}
          unlinkingId={
            unlinkAccount.isPending ? unlinkAccount.variables : undefined
          }
          onUnlink={(account) =>
            setUnlinkConfirm({ id: account.id, provider: account.providerId })
          }
        />
      )}
      <LinkAccountButtons
        accounts={accounts}
        disabled={loading || loadError !== undefined}
        linkingProvider={linking}
        onLink={(provider) => void startAccountLink(provider)}
      />
      <UnlinkAccountDialog
        confirmation={unlinkConfirm}
        pending={unlinkAccount.isPending}
        onClose={() => setUnlinkConfirm(null)}
        onConfirm={unlinkConfirmedAccount}
      />
    </div>
  )
}
