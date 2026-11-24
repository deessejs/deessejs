import { beforeEach, describe, expect, it, vi } from "vitest"

const { billingPortal, list, upgrade, proEntitlement } = vi.hoisted(() => ({
  billingPortal: vi.fn(),
  list: vi.fn(),
  upgrade: vi.fn(),
  proEntitlement: vi.fn(),
}))

vi.mock("@/lib/client", () => ({
  client: {
    auth: { subscription: { billingPortal, list, upgrade } },
    rpc: { organization: { proEntitlement } },
  },
}))

import {
  createOrganizationBillingPortal,
  startOrganizationCheckout,
} from "@/lib/organization-billing-actions"
import {
  organizationSubscriptionsQueryKey,
  organizationSubscriptionsQueryOptions,
} from "@/hooks/organizations/use-organization-subscriptions"
import {
  organizationBillingState,
  organizationProSeatCapacity,
} from "@/lib/organization-billing-state"
import { hasManagingRole } from "@workspace/auth/organization/roles"

describe("organization billing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("scopes raw billing detail reads to managers", async () => {
    list.mockResolvedValue({ data: [], error: null })
    const query = organizationSubscriptionsQueryOptions({
      organizationId: "org-a",
      organizationSlug: "acme",
      canManage: true,
    })

    expect(query.queryKey).toEqual([
      ...organizationSubscriptionsQueryKey("org-a"),
      "acme",
      "details",
    ])
    await query.queryFn?.({} as never)
    expect(list).toHaveBeenCalledWith({
      query: { referenceId: "org-a", customerType: "organization" },
    })
  })

  it("uses only the sanitized entitlement result for ordinary members", async () => {
    proEntitlement.mockResolvedValue({ proIncluded: true })
    const query = organizationSubscriptionsQueryOptions({
      organizationId: "org-a",
      organizationSlug: "acme",
      canManage: false,
    })

    await expect(query.queryFn?.({} as never)).resolves.toEqual({
      kind: "entitlement",
      proIncluded: true,
    })
    expect(proEntitlement).toHaveBeenCalledWith({ slug: "acme" })
    expect(list).not.toHaveBeenCalled()
  })

  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
  ])("allows billing mutations for %s role: %s", (role, allowed) => {
    expect(hasManagingRole(role)).toBe(allowed)
  })

  it("shows seat capacity for a qualifying trialing Pro subscription", () => {
    const now = new Date("2026-11-23T12:00:00.000Z")

    expect(
      organizationProSeatCapacity(
        [
          {
            plan: "pro",
            status: "trialing",
            billingInterval: "month",
            seats: 3,
            cancelAtPeriodEnd: true,
            periodEnd: new Date("2026-11-24T12:00:00.000Z"),
          },
        ],
        now
      )
    ).toBe(3)
  })

  it.each([
    ["ended", { endedAt: new Date("2026-11-22T12:00:00.000Z") }],
    [
      "past cancellation period",
      {
        cancelAtPeriodEnd: true,
        periodEnd: new Date("2026-11-22T12:00:00.000Z"),
      },
    ],
    [
      "missing cancellation period end",
      { cancelAtPeriodEnd: true, periodEnd: null },
    ],
  ] as const)("does not expose Pro seat capacity for a trial that is %s", (_, extra) => {
    expect(
      organizationProSeatCapacity(
        [
          {
            plan: "pro",
            status: "trialing",
            billingInterval: "month",
            seats: 3,
            ...extra,
          },
        ],
        new Date("2026-11-23T12:00:00.000Z")
      )
    ).toBe(0)
  })

  it("starts monthly Pro checkout with the resolved organization", async () => {
    upgrade.mockResolvedValue({
      data: { url: "https://checkout.example" },
      error: null,
    })

    await expect(
      startOrganizationCheckout({
        organizationId: "org-a",
        seats: 2,
        successUrl: "https://app.example/acme/settings/billing?billing=success",
        cancelUrl:
          "https://app.example/acme/settings/billing?billing=cancelled",
      })
    ).resolves.toBe("https://checkout.example")
    expect(upgrade).toHaveBeenCalledWith({
      plan: "pro",
      referenceId: "org-a",
      customerType: "organization",
      seats: 2,
      successUrl: "https://app.example/acme/settings/billing?billing=success",
      cancelUrl: "https://app.example/acme/settings/billing?billing=cancelled",
      disableRedirect: true,
    })
  })

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
        seats: 1,
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
    const query = organizationSubscriptionsQueryOptions({
      organizationId: "org-disabled",
      organizationSlug: "disabled",
      canManage: true,
    })

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
