"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  canManageBilling,
  organizationSubscriptionQueryOptions,
  selectCurrentSubscription,
  useOrganizationBilling,
  useOrganizationBillingMutations,
  type BillingPlan,
} from "@/hooks/use-organization-billing"

type Organization = { id: string; name: string; slug: string; role: string }

function BillingActions({
  canManage,
  busy,
  loading,
  hasError,
  plan,
  onCheckout,
  onPortal,
}: {
  canManage: boolean
  busy: boolean
  loading: boolean
  hasError: boolean
  plan: string | undefined
  onCheckout: (plan: BillingPlan) => void
  onPortal: () => void
}) {
  if (!canManage) return <p className="text-copy-14 text-muted-foreground">Only organization owners and admins can manage billing.</p>
  const disabled = busy || loading || hasError
  return <div className="flex flex-wrap gap-2">
    <Button disabled={disabled || plan === "pro-monthly"} onClick={() => onCheckout("pro-monthly")}>{plan === "pro-monthly" ? "Current monthly plan" : plan ? "Switch to monthly" : "Subscribe monthly"}</Button>
    <Button variant="outline" disabled={disabled || plan === "pro-annual"} onClick={() => onCheckout("pro-annual")}>{plan === "pro-annual" ? "Current annual plan" : plan ? "Switch to annual" : "Subscribe annually"}</Button>
    {plan ? <Button variant="outline" disabled={busy} onClick={onPortal}>Manage billing</Button> : null}
  </div>
}

export function OrganizationBilling({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient()
  const subscriptionQuery = useOrganizationBilling(organization.id)
  const { checkout, portal } = useOrganizationBillingMutations(organization.id)
  const subscription = selectCurrentSubscription(subscriptionQuery.data ?? [])
  const busy = checkout.isPending || portal.isPending
  const canManage = canManageBilling(organization.role)
  const canChangePlan = !subscription || Boolean(subscription.stripeSubscriptionId)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has("checkoutSessionId") && !params.has("success")) return
    void queryClient.invalidateQueries({ queryKey: organizationSubscriptionQueryOptions(organization.id).queryKey })
  }, [organization.id, queryClient])

  function startCheckout(plan: BillingPlan) {
    if (subscription?.plan === plan) return
    if (!canChangePlan) return
    checkout.mutate({ plan, ...(subscription?.stripeSubscriptionId ? { subscriptionId: subscription.stripeSubscriptionId } : {}) })
  }

  const error = subscriptionQuery.error ?? checkout.error ?? portal.error

  return <div className="flex flex-col gap-6">
    <header><h1 className="text-heading-32">Billing</h1><p className="text-copy-14 text-muted-foreground">Manage the {organization.name} subscription and Pro access.</p></header>
    <Card><CardHeader><CardTitle>Organization subscription</CardTitle><CardDescription>Pro access is shared with every member of this organization.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4">
        {subscriptionQuery.isPending ? <p role="status">Loading billing details…</p> : null}
        {subscriptionQuery.isError ? <p role="alert" className="text-copy-14 text-destructive">Billing details are unavailable. {subscriptionQuery.error.message}</p> : null}
        {!subscriptionQuery.isPending && !subscriptionQuery.isError ? <p aria-live="polite">{subscription ? `${subscription.plan} · ${subscription.status}${subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}` : "No active subscription"}</p> : null}
        <BillingActions canManage={canManage} busy={busy || !canChangePlan} loading={subscriptionQuery.isPending} hasError={subscriptionQuery.isError} plan={subscription?.plan} onCheckout={startCheckout} onPortal={() => portal.mutate()} />
        {error && !subscriptionQuery.isError ? <p role="alert" className="text-copy-14 text-destructive">{error.message}</p> : null}
      </CardContent>
    </Card>
  </div>
}
