import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface InviteToOrganizationProps {
	url: string
	inviter: string
	organizationName: string
}

/**
 * Workspace invitation email (ADR-030 §"Decision #1").
 *
 * Sent when an org owner/admin creates an invitation. The URL
 * routes to `/invite/<invitationId>`, a public page that checks
 * the session and either accepts (signs the user up as a member
 * of the org) or bounces them to `/login` with a round-tripped
 * redirect.
 *
 * The body markup is intentionally minimal — the full React
 * Email layout is owned by PR #4 of ADR-030 once the template is
 * shipped to design review. For now the call site compiles and
 * sends an email that renders a single CTA button.
 */
export function InviteToOrganization({
	url,
	inviter,
	organizationName,
}: InviteToOrganizationProps) {
	return (
		<BaseLayout
			preview={`${inviter} invited you to join ${organizationName} on DeesseJS.`}
		>
			<Heading className="text-xl font-semibold text-gray-900">
				You&apos;ve been invited
			</Heading>
			<Text className="text-gray-700">
				<strong>{inviter}</strong> invited you to join{" "}
				<strong>{organizationName}</strong> on DeesseJS.
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
				This invitation expires in 48 hours. If you don&apos;t recognise{" "}
				{organizationName}, you can safely ignore this email.
				<br />
				<Link href={url} className="text-brand underline">
					{url}
				</Link>
			</Text>
		</BaseLayout>
	)
}
