import { AuthContainer, SignupForm } from "@/components/auth"
import { safeRedirect } from "@workspace/utils/safe-redirect"

export default async function SignupPage({
	searchParams,
}: {
	searchParams: Promise<{ redirect?: string | string[] }>
}) {
	const params = await searchParams
	const rawRedirect = Array.isArray(params.redirect)
		? params.redirect[0]
		: params.redirect
	const redirectTo = safeRedirect(rawRedirect, "/home")

	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Create account"
				description="Sign up to get started."
			/>
			<AuthContainer.Content>
				<SignupForm redirectTo={redirectTo} />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
