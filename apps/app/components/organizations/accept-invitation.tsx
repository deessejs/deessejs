"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"

import { authClient } from "@/lib/auth-client"
import { workspaceHomePath } from "@/lib/workspace-paths"

type InvitationDetails = NonNullable<
  Awaited<ReturnType<typeof authClient.organization.getInvitation>>["data"]
>

function invitationQueryOptions(invitationId: string, userId?: string) {
  return queryOptions({
    queryKey: ["organization-invitation", invitationId, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        query: { id: invitationId },
      })
      if (error || !data) {
        throw new Error(error?.message ?? "This invitation is unavailable.")
      }
      return data
    },
  })
}

export function AcceptInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const session = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const invitationPath = `/accept-invitation/${encodeURIComponent(invitationId)}`
  const signedInUser = session.data?.user
  const invitationQuery = useQuery(
    invitationQueryOptions(invitationId, signedInUser?.id)
  )
  const invitation = invitationQuery.data ?? null
  const loading = Boolean(signedInUser) && invitationQuery.isPending
  const displayedFailure = failure ?? invitationQuery.error?.message ?? null

  async function accept() {
    setSubmitting(true)
    setFailure(null)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) {
        setFailure(error.message ?? "The invitation could not be accepted.")
        return
      }
      if (invitation) router.replace(workspaceHomePath(invitation.organizationSlug))
    } catch {
      setFailure("The invitation could not be accepted.")
    } finally {
      setSubmitting(false)
    }
  }

  async function sendVerification() {
    if (!signedInUser) return
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: signedInUser.email,
        callbackURL: invitationPath,
      })
      if (error) {
        setFailure(error.message ?? "The verification email could not be sent.")
      } else {
        setFailure(null)
        toast.success("Verification email sent. Check your inbox.")
      }
    } catch {
      setFailure("The verification email could not be sent.")
    }
  }

  async function switchAccount() {
    try {
      await authClient.signOut()
      router.refresh()
    } catch {
      setFailure("Could not sign out of this account.")
    }
  }

  return (
    <InvitationPresentation
      invitationId={invitationId}
      invitationPath={invitationPath}
      user={signedInUser}
      invitation={invitation}
      loading={loading}
      submitting={submitting}
      failure={displayedFailure}
      onAccept={() => void accept()}
      onSendVerification={() => void sendVerification()}
      onSwitchAccount={() => void switchAccount()}
    />
  )
}

function InvitationPresentation({
  invitationId,
  invitationPath,
  user,
  invitation,
  loading,
  submitting,
  failure,
  onAccept,
  onSendVerification,
  onSwitchAccount,
}: {
  invitationId: string
  invitationPath: string
  user: { email: string; emailVerified: boolean } | undefined
  invitation: InvitationDetails | null
  loading: boolean
  submitting: boolean
  failure: string | null
  onAccept: () => void
  onSendVerification: () => void
  onSwitchAccount: () => void
}) {
  const authLink = (path: "/login" | "/signup") =>
    `${path}?redirect=${encodeURIComponent(invitationPath)}`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Accept your invitation</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with the invited email address to join the organization.
        </p>
      </header>
      {failure && <p className="text-sm text-destructive" role="alert">{failure}</p>}
      <InvitationBody
        invitationId={invitationId}
        authLink={authLink}
        user={user}
        invitation={invitation}
        loading={loading}
        submitting={submitting}
        onAccept={onAccept}
        onSendVerification={onSendVerification}
        onSwitchAccount={onSwitchAccount}
      />
    </div>
  )
}

function InvitationBody({
  invitationId,
  authLink,
  user,
  invitation,
  loading,
  submitting,
  onAccept,
  onSendVerification,
  onSwitchAccount,
}: {
  invitationId: string
  authLink: (path: "/login" | "/signup") => string
  user: { email: string; emailVerified: boolean } | undefined
  invitation: InvitationDetails | null
  loading: boolean
  submitting: boolean
  onAccept: () => void
  onSendVerification: () => void
  onSwitchAccount: () => void
}) {
  if (!user) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Sign in or create an account using the email address that received this invitation.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href={authLink("/login")}>Log in</Link></Button>
          <Button variant="outline" asChild><Link href={authLink("/signup")}>Create account</Link></Button>
        </div>
      </div>
    )
  }
  if (loading) return <p className="text-sm text-muted-foreground">Loading invitation…</p>
  if (!invitation) {
    return <p className="text-sm text-destructive" role="alert">
      {invitationId ? "This invitation is unavailable." : "This invitation link is invalid."}
    </p>
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <p className="text-sm">
        Invitation to <span className="font-medium">{invitation.organizationName}</span> for{" "}
        <span className="font-medium">{invitation.email}</span>.
      </p>
      <InvitationActions
        user={user}
        invitation={invitation}
        submitting={submitting}
        onAccept={onAccept}
        onSendVerification={onSendVerification}
        onSwitchAccount={onSwitchAccount}
      />
    </div>
  )
}

function InvitationActions({
  user,
  invitation,
  submitting,
  onAccept,
  onSendVerification,
  onSwitchAccount,
}: {
  user: { email: string; emailVerified: boolean }
  invitation: InvitationDetails
  submitting: boolean
  onAccept: () => void
  onSendVerification: () => void
  onSwitchAccount: () => void
}) {
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">
          You are signed in as {user.email}. Sign in with the invited email to continue.
        </p>
        <Button variant="outline" onClick={onSwitchAccount}>Switch account</Button>
      </div>
    )
  }
  if (!user.emailVerified) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Verify your email address before accepting this invitation.
        </p>
        <Button variant="outline" onClick={onSendVerification}>Send verification email</Button>
      </div>
    )
  }
  return (
    <Button disabled={submitting} onClick={onAccept}>
      {submitting ? "Accepting…" : `Join ${invitation.organizationName}`}
    </Button>
  )
}
