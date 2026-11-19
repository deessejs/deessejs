import { beforeEach, describe, expect, it, vi } from "vitest"

const { billingPortal, list, upgrade } = vi.hoisted(() => ({
  billingPortal: vi.fn(),
  list: vi.fn(),
  upgrade: vi.fn(),
}))

vi.mock("@/lib/client", () => ({
  client: { auth: { subscription: { billingPortal, list, upgrade } } },
}))

import {
  createOrganizationBillingPortal,
  startOrganizationCheckout,
} from "@/lib/organization-billing-actions"
import {
  organizationSubscriptionsQueryKey,
  organizationSubscriptionsQueryOptions,
} from "@/lib/organization-billing-query"
import { organizationBillingState } from "@/lib/organization-billing-state"
import { hasManagingRole } from "@workspace/auth/organization/roles"

describe("organization billing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("scopes list queries to the requested organization", async () => {
    list.mockResolvedValue({ data: [], error: null })
    const query = organizationSubscriptionsQueryOptions("org-a")

    expect(query.queryKey).toEqual(organizationSubscriptionsQueryKey("org-a"))
    await query.queryFn?.({} as never)
    expect(list).toHaveBeenCalledWith({
      query: { referenceId: "org-a", customerType: "organization" },
    })
  })

  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
  ])("allows billing mutations for %s role: %s", (role, allowed) => {
    expect(hasManagingRole(role)).toBe(allowed)
  })

  it.each([false, true])(
    "starts Pro checkout with the resolved org and annual=%s",
    async (annual) => {
      upgrade.mockResolvedValue({
        data: { url: "https://checkout.example" },
        error: null,
      })

      await expect(
        startOrganizationCheckout({
          organizationId: "org-a",
          annual,
          successUrl:
            "https://app.example/acme/settings/billing?billing=success",
          cancelUrl:
            "https://app.example/acme/settings/billing?billing=cancelled",
        })
      ).resolves.toBe("https://checkout.example")
      expect(upgrade).toHaveBeenCalledWith({
        plan: "pro",
        annual,
        referenceId: "org-a",
        customerType: "organization",
        successUrl: "https://app.example/acme/settings/billing?billing=success",
        cancelUrl:
          "https://app.example/acme/settings/billing?billing=cancelled",
        disableRedirect: true,
      })
    }
  )

  it("surfaces checkout and portal errors", async () => {
    upgrade.mockResolvedValue({
      data: null,
      error: { message: "Checkout unavailable" },
    })
    billingPortal.mockResolvedValue({
      data: null,
      error: { message: "Portal unavailable" },
    })

    await expect(
      startOrganizationCheckout({
        organizationId: "org-b",
        annual: false,
        successUrl: "/billing?billing=success",
        cancelUrl: "/billing?billing=cancelled",
      })
    ).rejects.toThrow("Checkout unavailable")
    await expect(
      createOrganizationBillingPortal({
        organizationId: "org-b",
        returnUrl: "/org-b/settings/billing",
      })
    ).rejects.toThrow("Portal unavailable")
    expect(billingPortal).toHaveBeenCalledWith({
      referenceId: "org-b",
      customerType: "organization",
      returnUrl: "/org-b/settings/billing",
      disableRedirect: true,
    })
  })

  it("returns the portal URL for the same organization", async () => {
    billingPortal.mockResolvedValue({
      data: { url: "https://billing.example" },
      error: null,
    })

    await expect(
      createOrganizationBillingPortal({
        organizationId: "org-c",
        returnUrl: "/org-c/settings/billing",
      })
    ).resolves.toBe("https://billing.example")
    expect(billingPortal).toHaveBeenCalledWith({
      referenceId: "org-c",
      customerType: "organization",
      returnUrl: "/org-c/settings/billing",
      disableRedirect: true,
    })
  })

  it("turns a failed subscription list into an unavailable state", async () => {
    list.mockResolvedValue({ data: null, error: { message: "Not configured" } })
    const query = organizationSubscriptionsQueryOptions("org-disabled")

    await expect(query.queryFn?.({} as never)).rejects.toThrow("Not configured")
    expect(
      organizationBillingState({
        isPending: false,
        isError: true,
        subscriptionCount: 0,
      })
    ).toBe("unavailable")
  })

  it.each([
    [{ isPending: true, isError: false, subscriptionCount: 0 }, "loading"],
    [{ isPending: false, isError: true, subscriptionCount: 0 }, "unavailable"],
    [{ isPending: false, isError: false, subscriptionCount: 0 }, "empty"],
    [{ isPending: false, isError: false, subscriptionCount: 1 }, "subscribed"],
  ] as const)("maps billing query state to %s", (input, state) => {
    expect(organizationBillingState(input)).toBe(state)
  })
})
