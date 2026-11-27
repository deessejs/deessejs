// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AccountInvitations } from "@/components/organizations/account-invitations"
import { workspaceHomePath } from "@/lib/workspace-paths"
import { AsyncButton } from "@workspace/ui/components/async-button"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  useSession: vi.fn(),
  accountInvitations: vi.fn(),
  acceptInvitation: vi.fn(),
  rejectInvitation: vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock("@/lib/client", () => ({
  client: {
    auth: {
      useSession: mocks.useSession,
      organization: {
        acceptInvitation: mocks.acceptInvitation,
        rejectInvitation: mocks.rejectInvitation,
      },
    },
    rpc: { organization: { accountInvitations: mocks.accountInvitations } },
  },
}))

const invitation = {
  id: "invitation-1",
  organizationName: "Acme",
  organizationSlug: "acme",
  inviterName: "Ada Lovelace",
  role: "admin",
  expiresAt: "2026-12-01T00:00:00.000Z",
  expired: false,
}

function renderInvitations() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountInvitations />
    </QueryClientProvider>
  )
}

describe("account invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSession.mockReturnValue({
      data: { user: { emailVerified: true } },
    })
    mocks.accountInvitations.mockResolvedValue([invitation])
    mocks.acceptInvitation.mockResolvedValue({ data: {}, error: null })
    mocks.rejectInvitation.mockResolvedValue({ data: {}, error: null })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("hides invitations until the user verifies their email", () => {
    mocks.useSession.mockReturnValue({
      data: { user: { emailVerified: false } },
    })

    renderInvitations()

    expect(screen.getByText(/verify your email address/i)).toBeTruthy()
    expect(screen.queryByText(invitation.organizationName)).toBeNull()
    expect(mocks.accountInvitations).not.toHaveBeenCalled()
    expect(mocks.useSession).toHaveBeenCalledTimes(1)
  })

  it("renders loading, empty, and retryable load-error states", async () => {
    let resolveInvitations!: (value: (typeof invitation)[]) => void
    mocks.accountInvitations.mockReturnValueOnce(
      new Promise<(typeof invitation)[]>((resolve) => {
        resolveInvitations = resolve
      })
    )
    renderInvitations()
    expect(screen.getByText("Loading invitations…")).toBeTruthy()
    resolveInvitations([])
    expect(
      await screen.findByText("You have no pending organization invitations.")
    ).toBeTruthy()

    mocks.accountInvitations.mockRejectedValueOnce(new Error("network"))
    const { unmount } = renderInvitations()
    expect(await screen.findByRole("alert")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(() =>
      expect(mocks.accountInvitations).toHaveBeenCalledTimes(3)
    )
    unmount()
  })

  it("accepts, invalidates the list, and navigates to the workspace", async () => {
    const { container } = renderInvitations()
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }))

    await waitFor(() => {
      expect(mocks.acceptInvitation).toHaveBeenCalledWith({
        invitationId: invitation.id,
      })
      expect(mocks.push).toHaveBeenCalledWith(workspaceHomePath("acme"))
    })
    expect(screen.getByRole("status").textContent).toBe("Invitation accepted.")
    expect(mocks.accountInvitations).toHaveBeenCalledTimes(2)
    expect(container.querySelector("[data-pending]")).toBeNull()
  })

  it("declines, invalidates the list, and announces the result", async () => {
    renderInvitations()
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }))

    await waitFor(() =>
      expect(mocks.rejectInvitation).toHaveBeenCalledWith({
        invitationId: invitation.id,
      })
    )
    expect((await screen.findByRole("status")).textContent).toBe(
      "Invitation declined."
    )
    expect(mocks.accountInvitations).toHaveBeenCalledTimes(2)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it("shows server errors and prevents actions on expired invitations", async () => {
    mocks.acceptInvitation.mockResolvedValueOnce({
      data: null,
      error: { message: "Invitation has expired" },
    })
    mocks.accountInvitations.mockResolvedValueOnce([
      { ...invitation, expired: true },
    ])
    const expiredView = renderInvitations()

    expect(await screen.findByText("This invitation has expired.")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Accept" }).hasAttribute("disabled")
    ).toBe(true)
    expect(
      screen.getByRole("button", { name: "Decline" }).hasAttribute("disabled")
    ).toBe(true)

    expiredView.unmount()
    mocks.accountInvitations.mockResolvedValueOnce([invitation])
    renderInvitations()
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }))
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Invitation has expired"
    )
  })

  it("shows a useful error when an action throws", async () => {
    mocks.rejectInvitation.mockRejectedValueOnce(new Error("Connection lost"))
    renderInvitations()
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }))

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Connection lost"
    )
  })
})

describe("AsyncButton", () => {
  it("exposes pending behavior accessibly and ignores repeated presses", async () => {
    let finish!: () => void
    const action = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve))
    )
    render(
      <AsyncButton onClick={action} pendingAnnouncement="Saving">
        Save
      </AsyncButton>
    )

    const button = screen.getByRole("button", { name: "Save" })
    fireEvent.click(button)
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"))
    expect(button.hasAttribute("data-pending")).toBe(true)
    expect(button.getAttribute("aria-disabled")).toBe("true")
    expect(button.hasAttribute("disabled")).toBe(false)

    fireEvent.click(button)
    expect(action).toHaveBeenCalledTimes(1)
    finish()
    await waitFor(() => expect(button.hasAttribute("data-pending")).toBe(false))
    expect(button.getAttribute("aria-busy")).toBeNull()
  })
})
