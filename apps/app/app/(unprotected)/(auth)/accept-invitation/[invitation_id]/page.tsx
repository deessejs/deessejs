import { AuthContainer } from "@/components/auth/container"
import { AcceptInvitation } from "@/components/organizations/accept-invitation"

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitation_id: string }>
}) {
  const { invitation_id } = await params

  return (
    <AuthContainer.Root>
      <AuthContainer.Content>
        <AcceptInvitation invitationId={invitation_id} />
      </AuthContainer.Content>
    </AuthContainer.Root>
  )
}
