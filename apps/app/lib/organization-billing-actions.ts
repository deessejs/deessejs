import { client } from "@/lib/client"

export async function startOrganizationCheckout(input: {
  organizationId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const { data, error } = await client.auth.subscription.upgrade({
    plan: "pro",
    referenceId: input.organizationId,
    customerType: "organization",
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    disableRedirect: true,
  })
  if (error) throw new Error(error.message ?? "Could not start checkout")
  if (!data?.url) throw new Error("Checkout did not return a URL")
  return data.url
}

export async function createOrganizationBillingPortal(input: {
  organizationId: string
  returnUrl: string
}): Promise<string> {
  const { data, error } = await client.auth.subscription.billingPortal({
    referenceId: input.organizationId,
    customerType: "organization",
    returnUrl: input.returnUrl,
    disableRedirect: true,
  })
  if (error) throw new Error(error.message ?? "Could not open billing portal")
  if (!data?.url) throw new Error("Billing portal did not return a URL")
  return data.url
}
