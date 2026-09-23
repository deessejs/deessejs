import { AuthContainer, ForgotPasswordForm } from "@/components/auth"

export default function ForgotPasswordPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Forgot password"
				description="Enter your email and we'll send you a reset link."
			/>
			<AuthContainer.Content>
				<ForgotPasswordForm />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
