import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface VerifyEmailProps {
  url: string
  userEmail: string
}

export function VerifyEmail({ url, userEmail }: VerifyEmailProps) {
  return (
    <BaseLayout preview="Click the link to confirm your address and activate your account.">
      <Heading className="text-xl font-semibold text-gray-900">
        Verify your email
      </Heading>
      <Text className="text-gray-700">
        Thanks for signing up. Please confirm that <strong>{userEmail}</strong> is your email address.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText"
        >
          Verify email
        </Button>
      </Section>
      <Text className="text-sm text-gray-600">
        Or copy and paste this link into your browser:
        <br />
        <Link href={url} className="text-brand underline">
          {url}
        </Link>
      </Text>
    </BaseLayout>
  )
}