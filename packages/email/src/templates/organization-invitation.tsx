import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface OrganizationInvitationProps {
  /** Absolute link to the accept-invitation page. */
  url: string
  organizationName: string
  /** Display name of whoever sent the invitation. */
  inviterName: string
  expiresAt: Date
}

export function OrganizationInvitation({
  url,
  organizationName,
  inviterName,
  expiresAt,
}: OrganizationInvitationProps) {
  // ISO date rather than a locale-formatted string. The template is
  // rendered on the server, so a locale format would make the output
  // depend on the host's timezone, and the invitation window is
  // absolute anyway.
  const expiryDate = expiresAt.toISOString().slice(0, 10)

  return (
    <BaseLayout
      preview={`${inviterName} invited you to join ${organizationName} on DeesseJS.`}
    >
      <Heading className="text-xl font-semibold text-gray-900">
        Join {organizationName}
      </Heading>
      <Text className="text-gray-700">
        <strong>{inviterName}</strong> invited you to join{" "}
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
        This invitation expires on {expiryDate}. If you weren&apos;t expecting
        it, you can safely ignore this email.
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