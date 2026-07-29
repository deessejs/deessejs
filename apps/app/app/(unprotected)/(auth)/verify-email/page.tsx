import { AuthContainer, VerifyEmailPage as VerifyEmailPageComponent } from "@/components/auth"

export default function VerifyEmailPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Content>
				<VerifyEmailPageComponent />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
