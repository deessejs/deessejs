import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface OrganizationInvitationProps {
	url: string
	organizationName: string
	inviterName: string
	recipientEmail: string
}

/**
 * Organization invitation email. Identifies the organization, the
 * inviter, and contains one acceptance link. The link is built by
 * `packages/auth/src/organization-invitation.ts` from
 * `serverEnv.APP_URL` and the encoded invitation id (RFC-001 §9).
 *
 * The link expires in 48 hours per the plugin's
 * `invitationExpiresIn` configuration.
 */
export function OrganizationInvitation({
	url,
	organizationName,
	inviterName,
	recipientEmail,
}: OrganizationInvitationProps) {
	return (
		<BaseLayout preview={`${inviterName} invited you to ${organizationName} on DeesseJS`}>
			<Heading className="text-xl font-semibold text-gray-900">
				Join {organizationName} on DeesseJS
			</Heading>
			<Text className="text-gray-700">
				<strong>{inviterName}</strong> invited <strong>{recipientEmail}</strong>{" "}
				to join the <strong>{organizationName}</strong> organization on DeesseJS.
			</Text>
			<Section className="my-6 text-center">
				<Button
					href={url}
					className="rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText"
				>
					Accept invitation
				</Button>
			</Section>
			<Text className="text-sm text-gray-600">
				This invitation expires in 48 hours. If you didn&apos;t expect this
				invitation, you can safely ignore this email.
				<br />
				Or copy and paste this link:
				<br />
				<Link href={url} className="text-brand underline">
					{url}
				</Link>
			</Text>
		</BaseLayout>
	)
}
