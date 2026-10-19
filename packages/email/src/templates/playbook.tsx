import { Button, Heading, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

/**
 * Playbook download email — sent after a successful signup on
 * `/playbook`.
 *
 * Carries the PDF download URL in both a primary button and a plain
 * fallback link, so the email works in clients that strip buttons or
 * images. When `consentMarketing` is true, a short paragraph
 * acknowledges the opt-in and points at the unsubscribe link the
 * Resend Audience adds to every future email automatically.
 *
 * The `pdfUrl` is a fully-qualified public URL — the same one the
 * `/playbook.pdf` static asset resolves to. Until the real PDF lands
 * in `apps/web/public/playbook/`, this URL 404s; the playbook page
 * itself stays in draft, so no production signup ever resolves to
 * a 404 link.
 */
interface PlaybookDownloadProps {
  pdfUrl: string
  consentMarketing: boolean
}

export function PlaybookDownload({
  pdfUrl,
  consentMarketing,
}: PlaybookDownloadProps) {
  return (
    <BaseLayout preview="The PDF is one click away — here's the direct link.">
      <Heading className="text-xl font-semibold text-gray-900">
        Your playbook is ready
      </Heading>
      <Text className="text-gray-700">
        Thanks for grabbing the playbook. Click the button below to
        download the PDF.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={pdfUrl}
          className="rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText"
        >
          Download the PDF
        </Button>
      </Section>
      <Text className="text-sm text-gray-600">
        If the button doesn&apos;t work, copy this link into your browser:
        <br />
        <a href={pdfUrl} className="text-brand underline">
          {pdfUrl}
        </a>
      </Text>
      {consentMarketing ? (
        <Text className="text-sm text-gray-600">
          You also opted in to occasional updates about DeesseJS.
          Unsubscribe any time from the link at the bottom of any
          email we send.
        </Text>
      ) : null}
    </BaseLayout>
  )
}
