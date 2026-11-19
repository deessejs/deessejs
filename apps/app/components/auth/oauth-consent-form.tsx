"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { client } from "@/lib/client"

type OAuthClientDisplay = {
  client_name?: string
  client_uri?: string
  tos_uri?: string
  policy_uri?: string
}

type ConsentRequest = {
  clientId: string
  redirectHost: string
  resource: string
  scopes: string[]
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Confirm your DeesseJS account identity.",
  profile: "Share basic profile details with this app.",
  offline_access: "Keep the connection active between visits.",
  "templates:read": "Read the public DeesseJS template catalog.",
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

export function OAuthConsentForm() {
  const [request, setRequest] = useState<ConsentRequest | null>(null)
  const [oauthClient, setOAuthClient] = useState<OAuthClientDisplay | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const signedNames = new Set(params.getAll("ba_param"))
    const clientId = params.get("client_id")
    const redirectUri = params.get("redirect_uri")
    const resource = params.get("resource")
    const scopes = (params.get("scope") ?? "").split(/\s+/).filter(Boolean)

    if (
      !clientId ||
      !redirectUri ||
      !resource ||
      !signedNames.has("client_id") ||
      !signedNames.has("redirect_uri") ||
      !signedNames.has("resource") ||
      (params.has("scope") && !signedNames.has("scope"))
    ) {
      setError(
        "This authorization request is incomplete. Start the connection again from your app."
      )
      return
    }

    let redirectHost: string
    try {
      redirectHost = new URL(redirectUri).host
    } catch {
      setError("This authorization request has an invalid return address.")
      return
    }

    void client.auth.oauth2
      .publicClientPrelogin({ client_id: clientId })
      .then(({ data, error: lookupError }) => {
        if (lookupError || !data) {
          setError(
            "We could not verify the requesting app. Restart the connection from your app."
          )
          return
        }
        setOAuthClient(data)
        setRequest({ clientId, redirectHost, resource, scopes })
      })
      .catch(() =>
        setError(
          "We could not verify the requesting app. Restart the connection from your app."
        )
      )
  }, [])

  async function decide(accept: boolean) {
    setSubmitting(true)
    try {
      const { error: consentError } = await client.auth.oauth2.consent({
        accept,
      })
      if (consentError)
        toast.error(consentError.message ?? "Could not save your decision")
    } catch {
      toast.error("Could not save your decision")
    } finally {
      setSubmitting(false)
    }
  }

  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    )
  if (!request || !oauthClient)
    return (
      <p className="text-sm text-muted-foreground">
        Verifying the connection request…
      </p>
    )

  const clientName =
    oauthClient.client_name?.trim() || "An app with an unverified name"
  const clientUrl = safeHttpsUrl(oauthClient.client_uri)
  const termsUrl = safeHttpsUrl(oauthClient.tos_uri)
  const policyUrl = safeHttpsUrl(oauthClient.policy_uri)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border p-4">
        <p className="font-medium">{clientName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Return address:{" "}
          <span className="font-mono break-all">{request.redirectHost}</span>
        </p>
        {clientUrl && (
          <a
            className="mt-2 inline-block text-sm underline"
            href={clientUrl}
            target="_blank"
            rel="noreferrer"
          >
            App details
          </a>
        )}
      </div>

      <section
        className="flex flex-col gap-2"
        aria-labelledby="oauth-access-heading"
      >
        <h2 id="oauth-access-heading" className="text-sm font-semibold">
          Requested access
        </h2>
        {request.scopes.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {request.scopes.map((scope) => (
              <li key={scope} className="rounded-md bg-muted px-3 py-2">
                <p className="text-sm font-medium">{scope}</p>
                <p className="text-sm text-muted-foreground">
                  {SCOPE_DESCRIPTIONS[scope] ??
                    "This app requests the listed account permission."}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No explicit account scopes were requested.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Resource:{" "}
          <span className="font-mono break-all">{request.resource}</span>
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        App details are supplied by the requesting client. Review the return
        address before approving.
        {termsUrl && (
          <>
            {" "}
            <a
              className="underline"
              href={termsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Terms
            </a>
          </>
        )}
        {policyUrl && (
          <>
            {" "}
            ·{" "}
            <a
              className="underline"
              href={policyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Privacy policy
            </a>
          </>
        )}
      </p>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          variant="outline"
          disabled={submitting}
          onClick={() => void decide(false)}
        >
          Deny
        </Button>
        <Button
          className="flex-1"
          disabled={submitting}
          onClick={() => void decide(true)}
        >
          {submitting ? "Saving…" : "Approve"}
        </Button>
      </div>
    </div>
  )
}
