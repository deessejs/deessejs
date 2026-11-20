import { AuthContainer, LoginForm } from "@/components/auth"

export default function OAuthLoginPage() {
  return (
    <AuthContainer.Root>
      <AuthContainer.Header
        title="Sign in to continue"
        description="Sign in to DeesseJS to continue connecting your account."
      />
      <AuthContainer.Content>
        <LoginForm continueOAuthFlow />
      </AuthContainer.Content>
    </AuthContainer.Root>
  )
}
