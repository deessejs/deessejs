"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CreditCardIcon } from "lucide-react"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  createOrganizationBillingPortal,
  startOrganizationCheckout,
} from "@/lib/organization-billing-actions"
import {
  organizationSubscriptionsQueryKey,
  useOrganizationSubscriptions,
} from "@/hooks/organizations/use-organization-subscriptions"
import { organizationBillingState } from "@/lib/organization-billing-state"
import { workspaceBillingSettingsPath } from "@/lib/workspace-paths"

type BillingOrganization = {
  id: string
  name: string
  slug: string
  role: string
}

const billingDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

function BillingDetails({
  state,
  canManage,
  data,
  onRetry,
}: {
  state: ReturnType<typeof organizationBillingState>
  canManage: boolean
  data: ReturnType<typeof useOrganizationSubscriptions>["data"]
  onRetry: () => void
}) {
  if (state === "loading")
    return (
      <Skeleton className="h-5 w-48" aria-label="Loading billing details" />
    )
  if (state === "unavailable")
    return (
      <div className="rounded-md border border-destructive p-4" role="alert">
        <p className="font-medium">Billing is unavailable</p>
        <p className="text-sm text-muted-foreground">
          Stripe may not be configured, or the billing service could not be
          reached. You can retry in a moment.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  if (state === "empty")
    return (
      <p className="text-sm text-muted-foreground">
        {canManage
          ? "No subscription is configured for this organization."
          : "This organization does not include DeesseJS Pro."}
      </p>
    )
  if (data?.kind === "entitlement")
    return (
      <p className="text-sm">
        {data.proIncluded
          ? "DeesseJS Pro is included for this organization."
          : "This organization does not include DeesseJS Pro."}
      </p>
    )
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {(data?.subscriptions ?? []).map((subscription) => (
        <div key={subscription.id} className="rounded-md border p-4">
          <p className="font-medium">{subscription.plan}</p>
          <p className="text-sm text-muted-foreground">
            {subscription.status}
            {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
            {subscription.periodEnd
              ? ` · Period ends ${billingDateFormatter.format(subscription.periodEnd)}`
              : ""}
          </p>
        </div>
      ))}
    </div>
  )
}

function BillingActions({
  canManage,
  state,
  busy,
  onCheckout,
  onPortal,
}: {
  canManage: boolean
  state: ReturnType<typeof organizationBillingState>
  busy: boolean
  onCheckout: () => void
  onPortal: () => void
}) {
  if (!canManage)
    return (
      <p className="text-sm text-muted-foreground">
        Only organization owners and admins can manage billing.
      </p>
    )
  if (state === "loading" || state === "unavailable") return null
  return (
    <div className="flex flex-wrap gap-2">
      {state === "empty" ? (
        <Button disabled={busy} onClick={onCheckout}>
          Subscribe monthly
        </Button>
      ) : (
        <Button variant="outline" disabled={busy} onClick={onPortal}>
          <CreditCardIcon className="size-4" aria-hidden />
          Manage billing
        </Button>
      )}
    </div>
  )
}

export function OrganizationBilling({
  organization,
  billingReturn,
}: {
  organization: BillingOrganization
  billingReturn?: string | undefined
}) {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canManage = hasManagingRole(organization.role)
  const subscriptions = useOrganizationSubscriptions({
    organizationId: organization.id,
    organizationSlug: organization.slug,
    canManage,
  })
  const subscriptionCount =
    subscriptions.data?.kind === "billing"
      ? subscriptions.data.subscriptions.length
      : subscriptions.data?.kind === "entitlement" &&
          subscriptions.data.proIncluded
        ? 1
        : 0
  const billingState = organizationBillingState({
    isPending: subscriptions.isPending,
    isError: subscriptions.isError,
    subscriptionCount,
  })
  const billingPath = workspaceBillingSettingsPath(organization.slug)

  async function startCheckout() {
    setBusy(true)
    setActionError(null)
    try {
      const successUrl = new URL(billingPath, window.location.origin)
      successUrl.searchParams.set("billing", "success")
      const cancelUrl = new URL(billingPath, window.location.origin)
      cancelUrl.searchParams.set("billing", "cancelled")
      const url = await startOrganizationCheckout({
        organizationId: organization.id,
        successUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString(),
      })
      window.location.assign(url)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Checkout is unavailable."
      )
    } finally {
      setBusy(false)
    }
  }

  async function openBillingPortal() {
    setBusy(true)
    setActionError(null)
    try {
      const url = await createOrganizationBillingPortal({
        organizationId: organization.id,
        returnUrl: new URL(billingPath, window.location.origin).toString(),
      })
      window.location.assign(url)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "The billing portal could not be opened."
      )
    } finally {
      setBusy(false)
    }
  }

  function retry() {
    void queryClient.invalidateQueries({
      queryKey: organizationSubscriptionsQueryKey(organization.id),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the subscription for {organization.name}.
        </p>
      </header>

      {billingReturn === "success" && (
        <div className="rounded-md border p-4" role="status">
          <p className="font-medium">Checkout complete</p>
          <p className="text-sm text-muted-foreground">
            Subscription status may take a moment to update while Stripe
            confirms the payment.
          </p>
        </div>
      )}
      {billingReturn === "cancelled" && (
        <div className="rounded-md border p-4" role="status">
          <p className="font-medium">Checkout cancelled</p>
          <p className="text-sm text-muted-foreground">
            No subscription changes were made.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization subscription</CardTitle>
          <CardDescription>
            {canManage
              ? "Manage this organization's monthly Pro subscription."
              : "See whether DeesseJS Pro is included for this organization."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BillingDetails
            state={billingState}
            canManage={canManage}
            data={subscriptions.data}
            onRetry={retry}
          />
          <BillingActions
            canManage={canManage}
            state={billingState}
            busy={busy}
            onCheckout={() => void startCheckout()}
            onPortal={() => void openBillingPortal()}
          />
          {actionError && (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
