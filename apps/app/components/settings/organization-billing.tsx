"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { authClient } from "@/lib/auth-client"

type Organization = { id: string; name: string; slug: string; role: string }
type Subscription = { plan: string; status: string; cancelAtPeriodEnd?: boolean; periodEnd?: string }

export function OrganizationBilling({ organization }: { organization: Organization }) {
  const canManage = organization.role.split(",").some((role) => role === "owner" || role === "admin")
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void authClient.$fetch("/subscription/list", {
      method: "GET",
      query: { referenceId: organization.id, customerType: "organization" },
    }).then((result) => {
      const items = result.data as Subscription[] | null
      if (active) setSubscription(items?.[0] ?? null)
    }).catch(() => { if (active) setMessage("Billing details are unavailable right now.") })
    return () => { active = false }
  }, [organization.id])

  async function manageBilling() {
    setBusy(true)
    setMessage(null)
    try {
      const result = await authClient.$fetch("/subscription/billing-portal", {
        method: "POST",
        body: { referenceId: organization.id, customerType: "organization", returnUrl: window.location.href },
      })
      const url = (result.data as { url?: string } | null)?.url
      if (!url) throw new Error("Billing portal URL missing")
      window.location.assign(url)
    } catch {
      setMessage("The billing portal could not be opened. Stripe billing may not be configured yet.")
    } finally { setBusy(false) }
  }

  async function startCheckout(plan: "pro-monthly" | "pro-annual") {
    setBusy(true)
    setMessage(null)
    try {
      const result = await authClient.$fetch("/subscription/upgrade", {
        method: "POST",
        body: { plan, referenceId: organization.id, customerType: "organization", successUrl: window.location.href, cancelUrl: window.location.href },
      })
      const url = (result.data as { url?: string } | null)?.url
      if (!url) throw new Error("Checkout URL missing")
      window.location.assign(url)
    } catch {
      setMessage("Checkout is unavailable. Ask an organization owner or admin to check the Stripe configuration.")
    } finally { setBusy(false) }
  }

  return <div className="flex flex-col gap-6">
    <header><h1 className="text-heading-32">Billing</h1><p className="text-copy-14 text-muted-foreground">Manage the {organization.name} subscription and Pro access.</p></header>
    <Card><CardHeader><CardTitle>Organization subscription</CardTitle><CardDescription>Pro access is shared with every member of this organization.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p aria-live="polite">{subscription ? `${subscription.plan} · ${subscription.status}${subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}` : "No active subscription"}</p>
        {canManage ? <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void startCheckout("pro-monthly")}>Subscribe monthly</Button>
          <Button variant="outline" disabled={busy} onClick={() => void startCheckout("pro-annual")}>Subscribe annually</Button>
          {subscription ? <Button variant="outline" disabled={busy} onClick={() => void manageBilling()}>Manage billing</Button> : null}
        </div> : <p className="text-copy-14 text-muted-foreground">Only organization owners and admins can manage billing.</p>}
        {message ? <p role="status" className="text-copy-14 text-destructive">{message}</p> : null}
      </CardContent>
    </Card>
  </div>
}
