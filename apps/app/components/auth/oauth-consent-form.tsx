"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { client } from "@/lib/client"
import { useOAuthConsentRequest } from "@/hooks/use-oauth-consent-request"

const CONSENT_SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Confirm your DeesseJS account identity.",
  profile: "Share basic profile details with this app.",
  offline_access: "Keep the connection active between visits.",
  "templates:read": "Read the public DeesseJS template catalog.",
  "organizations:read":
    "Read the organizations you belong to and your current role in each.",
}

function safeHttpsUrl(value: string | undefined) {
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
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">
          Verifying the connection request…
        </p>
      }
    >
      <OAuthConsentFormContent />
    </Suspense>
  )
}

function OAuthConsentFormContent() {
  const searchParams = useSearchParams()
  const { request, oauthClient, error, isLoading } = useOAuthConsentRequest(
    searchParams.toString()
  )
  const form = useForm({
    defaultValues: { accept: false },
    onSubmit: async ({ value }) => {
      try {
        const { error: consentError } = await client.auth.oauth2.consent({
          accept: value.accept,
        })
        if (consentError) {
          toast.error(consentError.message ?? "Could not save your decision")
        }
      } catch {
        toast.error("Could not save your decision")
      }
    },
  })

  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    )
  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">
        Verifying the connection request…
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
                  {CONSENT_SCOPE_DESCRIPTIONS[scope] ??
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
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <>
              <Button
                className="flex-1"
                variant="outline"
                type="button"
                onClick={() => {
                  form.setFieldValue("accept", false)
                  void form.handleSubmit()
                }}
                disabled={submitting}
              >
                Deny
              </Button>
              <Button
                className="flex-1"
                type="button"
                onClick={() => {
                  form.setFieldValue("accept", true)
                  void form.handleSubmit()
                }}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Approve"}
              </Button>
            </>
          )}
        </form.Subscribe>
      </div>
    </div>
  )
}
