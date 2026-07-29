import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface ResetPasswordProps {
  url: string
  userEmail: string
}

export function ResetPassword({ url, userEmail }: ResetPasswordProps) {
  return (
    <BaseLayout preview="Click the link to set a new password. The link expires in 30 minutes.">
      <Heading className="text-xl font-semibold text-gray-900">
        Reset your password
      </Heading>
      <Text className="text-gray-700">
        We received a request to reset the password for <strong>{userEmail}</strong>.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText"
        >
          Reset password
        </Button>
      </Section>
      <Text className="text-sm text-gray-600">
        If you didn&apos;t request this, you can safely ignore this email.
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