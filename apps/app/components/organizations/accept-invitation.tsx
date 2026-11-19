"use client"

import { client } from "@/lib/client"
import {
  type InvitationDetails,
  useInvitationDetails,
  useRespondToInvitation,
  useSendVerificationEmail,
  useSignOut,
} from "@/hooks/use-account-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"

import { workspaceHomePath } from "@/lib/workspace-paths"

export function AcceptInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const session = client.auth.useSession()
  const invitationPath = `/accept-invitation/${encodeURIComponent(invitationId)}`
  const signedInUser = session.data?.user
  const invitationQuery = useInvitationDetails(invitationId, signedInUser?.id)
  const respond = useRespondToInvitation()
  const sendVerificationMutation = useSendVerificationEmail()
  const signOut = useSignOut()
  const invitation = invitationQuery.data ?? null
  const loading = Boolean(signedInUser) && invitationQuery.isPending
  const displayedFailure = [
    invitationQuery.error?.message,
    respond.error?.message,
    sendVerificationMutation.error?.message,
    signOut.error?.message,
  ].find(Boolean) ?? null

  async function accept() {
    try {
      await respond.mutateAsync({ invitationId, action: "accept" })
      if (invitation) router.replace(workspaceHomePath(invitation.organizationSlug))
    } catch { /* Mutation error is rendered below. */ }
  }

  async function sendVerification() {
    if (!signedInUser) return
    try {
      await sendVerificationMutation.mutateAsync({
        email: signedInUser.email,
        callbackURL: invitationPath,
      })
      toast.success("Verification email sent. Check your inbox.")
    } catch { /* Mutation error is rendered below. */ }
  }

  async function switchAccount() {
    try {
      await signOut.mutateAsync()
      router.refresh()
    } catch { /* Mutation error is rendered below. */ }
  }

  const submitting = respond.isPending

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
      sendingVerification={sendVerificationMutation.isPending}
      switchingAccount={signOut.isPending}
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
  sendingVerification,
  switchingAccount,
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
  sendingVerification: boolean
  switchingAccount: boolean
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
        sendingVerification={sendingVerification}
        switchingAccount={switchingAccount}
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
  sendingVerification,
  switchingAccount,
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
  sendingVerification: boolean
  switchingAccount: boolean
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
        sendingVerification={sendingVerification}
        switchingAccount={switchingAccount}
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
  sendingVerification,
  switchingAccount,
}: {
  user: { email: string; emailVerified: boolean }
  invitation: InvitationDetails
  submitting: boolean
  onAccept: () => void
  onSendVerification: () => void
  onSwitchAccount: () => void
  sendingVerification: boolean
  switchingAccount: boolean
}) {
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">
          You are signed in as {user.email}. Sign in with the invited email to continue.
        </p>
        <Button variant="outline" onClick={onSwitchAccount} disabled={switchingAccount} aria-busy={switchingAccount}>
          {switchingAccount ? "Signing out…" : "Switch account"}
        </Button>
      </div>
    )
  }
  if (!user.emailVerified) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Verify your email address before accepting this invitation.
        </p>
        <Button
          variant="outline"
          onClick={onSendVerification}
          disabled={sendingVerification}
          aria-busy={sendingVerification}
        >
          {sendingVerification ? "Sending…" : "Send verification email"}
        </Button>
      </div>
    )
  }
  return (
    <Button disabled={submitting} onClick={onAccept}>
      {submitting ? "Accepting…" : `Join ${invitation.organizationName}`}
    </Button>
  )
}
