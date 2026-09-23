import { AuthContainer, SignupForm } from "@/components/auth"

export default function SignupPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Create account"
				description="Sign up to get started."
			/>
			<AuthContainer.Content>
				<SignupForm />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
