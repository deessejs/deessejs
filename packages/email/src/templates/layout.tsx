import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

interface BaseLayoutProps {
  /** Inbox preview text (50-90 chars). */
  preview: string
  /** Email body content. */
  children: ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#0070f3",
                brandText: "#ffffff",
              },
            },
          },
        }}
      >
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-0 max-w-[600px] bg-white p-8">
            <Section>
              <Heading className="text-2xl font-bold text-gray-900">
                SaaS Template
              </Heading>
            </Section>
            <Hr className="my-4 border-gray-200" />
            {children}
            <Hr className="my-4 border-gray-200" />
            <Section>
              <Text className="text-xs text-gray-500">
                © {new Date().getFullYear()} SaaS Template. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}