"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { client } from "@/lib/client"

type OAuthConsentView = {
  id: string
  clientId: string
  resources?: string[]
  scopes: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

type OAuthClientView = {
  client_name?: string
  client_uri?: string
}

type AuthorizedClient = {
  consent: OAuthConsentView
  client: OAuthClientView | null
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
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()
}

export function AuthorizedOAuthClients() {
  const [items, setItems] = useState<AuthorizedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadConsents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: loadError } = await client.auth.oauth2.getConsents()
      if (loadError || !data) {
        setError(loadError?.message ?? "Could not load connected apps.")
        return
      }

      const entries = await Promise.all(
        (data as OAuthConsentView[]).map(async (consent) => {
          try {
            const { data: clientData } = await client.auth.oauth2.publicClient({
              query: { client_id: consent.clientId },
            })
            return { consent, client: clientData ?? null }
          } catch {
            return { consent, client: null }
          }
        })
      )
      setItems(entries)
    } catch {
      setError("Could not load connected apps.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConsents()
  }, [loadConsents])

  async function revoke(consentId: string) {
    setRevokingId(consentId)
    try {
      const { error: revokeError } = await client.auth.oauth2.deleteConsent({
        id: consentId,
      })
      if (revokeError) {
        toast.error(revokeError.message ?? "Could not revoke access")
        return
      }
      toast.success("App access revoked")
      await loadConsents()
    } catch {
      toast.error("Could not revoke access")
    } finally {
      setRevokingId(null)
    }
  }

  if (loading)
    return (
      <p className="text-sm text-muted-foreground">Loading authorized apps…</p>
    )
  if (error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void loadConsents()}>
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
                disabled={revokingId === consent.id}
                onClick={() => void revoke(consent.id)}
              >
                {revokingId === consent.id ? "Revoking…" : "Revoke access"}
              </Button>
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <p className="font-medium">Granted access</p>
                <p className="text-muted-foreground">
                  {consent.scopes
                    .map((scope) =>
                      scope === "templates:read"
                        ? "Read the public template catalog"
                        : scope === "openid"
                          ? "Confirm your account identity"
                          : scope === "profile"
                            ? "Share basic profile details"
                            : scope === "offline_access"
                              ? "Keep the connection active between visits"
                              : scope
                    )
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
