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
} from "@/lib/organization-billing-query"
import { organizationBillingState } from "@/lib/organization-billing-state"
import { workspaceBillingSettingsPath } from "@/lib/workspace-paths"

type BillingOrganization = {
  id: string
  name: string
  slug: string
  role: string
}

export function OrganizationBilling({
  organization,
  billingReturn,
}: {
  organization: BillingOrganization
  billingReturn?: string | undefined
}) {
  const queryClient = useQueryClient()
  const subscriptions = useOrganizationSubscriptions(organization.id)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canManage = hasManagingRole(organization.role)
  const billingState = organizationBillingState({
    isPending: subscriptions.isPending,
    isError: subscriptions.isError,
    subscriptionCount: subscriptions.data?.length ?? 0,
  })
  const billingPath = workspaceBillingSettingsPath(organization.slug)

  async function startCheckout(annual: boolean) {
    setBusy(true)
    setActionError(null)
    try {
      const successUrl = new URL(billingPath, window.location.origin)
      successUrl.searchParams.set("billing", "success")
      const cancelUrl = new URL(billingPath, window.location.origin)
      cancelUrl.searchParams.set("billing", "cancelled")
      const url = await startOrganizationCheckout({
        organizationId: organization.id,
        annual,
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
            Subscription details are shared with organization members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {billingState === "loading" ? (
            <Skeleton
              className="h-5 w-48"
              aria-label="Loading billing details"
            />
          ) : billingState === "unavailable" ? (
            <div
              className="rounded-md border border-destructive p-4"
              role="alert"
            >
              <p className="font-medium">Billing is unavailable</p>
              <p className="text-sm text-muted-foreground">
                Stripe may not be configured, or the billing service could not
                be reached. You can retry in a moment.
              </p>
              <Button variant="outline" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          ) : billingState === "empty" ? (
            <p className="text-sm text-muted-foreground">
              No subscription is configured for this organization.
            </p>
          ) : (
            <div className="flex flex-col gap-2" aria-live="polite">
              {(subscriptions.data ?? []).map((subscription) => (
                <div key={subscription.id} className="rounded-md border p-4">
                  <p className="font-medium">{subscription.plan}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status}
                    {subscription.cancelAtPeriodEnd
                      ? " · Cancels at period end"
                      : ""}
                    {subscription.periodEnd
                      ? ` · Period ends ${subscription.periodEnd.toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {canManage &&
            billingState !== "loading" &&
            billingState !== "unavailable" && (
              <div className="flex flex-wrap gap-2">
                {billingState === "empty" ? (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() => void startCheckout(false)}
                    >
                      Subscribe monthly
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void startCheckout(true)}
                    >
                      Subscribe annually
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void openBillingPortal()}
                  >
                    <CreditCardIcon className="size-4" aria-hidden />
                    Manage billing
                  </Button>
                )}
              </div>
            )}
          {!canManage && (
            <p className="text-sm text-muted-foreground">
              Only organization owners and admins can manage billing.
            </p>
          )}
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
