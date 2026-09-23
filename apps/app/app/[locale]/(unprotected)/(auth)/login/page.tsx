import { AuthContainer, LoginForm } from "@/components/auth"

export default function LoginPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Log in"
				description="Enter your credentials to access your account."
			/>
			<AuthContainer.Content>
				<LoginForm />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
