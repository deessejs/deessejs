"use client"

import { Button } from "@workspace/ui/components/button"
import {
  useAuthorizedOAuthClients,
  useRevokeOAuthConsent,
} from "@/hooks/use-authorized-oauth-clients"

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "templates:read": "Read the public template catalog",
  openid: "Confirm your account identity",
  profile: "Share basic profile details",
  offline_access: "Keep the connection active between visits",
}

function safeHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function formatDate(value: Date | string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

export function AuthorizedOAuthClients() {
  const { query, isSessionPending } = useAuthorizedOAuthClients()
  const revoke = useRevokeOAuthConsent()
  const items = query.data ?? []

  if (isSessionPending || query.isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading authorized apps…</p>
    )
  if (query.error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3">
        <p className="text-sm text-destructive">{query.error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch().catch(() => undefined)}
        >
          Retry
        </Button>
      </div>
    )
  }
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No apps have access to your account.
      </p>
    )

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ consent, client: clientMetadata }) => {
        const clientName =
          clientMetadata?.client_name?.trim() || "App with an unverified name"
        const clientUrl = safeHttpsUrl(clientMetadata?.client_uri)
        return (
          <article key={consent.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">{clientName}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {consent.clientId}
                </p>
                {clientUrl && (
                  <a
                    className="text-sm underline"
                    href={clientUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    App details
                  </a>
                )}
                <p className="text-xs text-muted-foreground">
                  Connected {formatDate(consent.createdAt)}
                </p>
                {formatDate(consent.updatedAt) !==
                  formatDate(consent.createdAt) && (
                  <p className="text-xs text-muted-foreground">
                    Permissions updated {formatDate(consent.updatedAt)}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(consent.id)}
              >
                {revoke.isPending && revoke.variables === consent.id
                  ? "Revoking…"
                  : "Revoke access"}
              </Button>
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <p className="font-medium">Granted access</p>
                <p className="text-muted-foreground">
                  {consent.scopes
                    .map((scope) => SCOPE_DESCRIPTIONS[scope] ?? scope)
                    .join(" · ")}
                </p>
              </div>
              {consent.resources && consent.resources.length > 0 && (
                <div>
                  <p className="font-medium">Resource</p>
                  <ul className="text-muted-foreground">
                    {consent.resources.map((resource) => (
                      <li
                        key={resource}
                        className="font-mono text-xs break-all"
                      >
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
