import { AuthContainer } from "@/components/auth"
import { OAuthConsentForm } from "@/components/auth/oauth-consent-form"

export default function OAuthConsentPage() {
  return (
    <AuthContainer.Root>
      <AuthContainer.Header
        title="Connect an app"
        description="Review what this app can access before you continue."
      />
      <AuthContainer.Content>
        <OAuthConsentForm />
      </AuthContainer.Content>
    </AuthContainer.Root>
  )
}
