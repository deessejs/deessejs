import { Suspense } from "react"
import { AuthContainer, LoginForm } from "@/components/auth"

export default function LoginPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Log in"
				description="Enter your credentials to access your account."
			/>
			<AuthContainer.Content>
				{/*
				 * `LoginForm` calls `useSearchParams` to read
				 * `?redirect=`. Next.js bails out of static
				 * generation for any client component that
				 * reads search params without a Suspense
				 * boundary; this can fail the production
				 * build with the "missing-suspense-with-
				 * csr-bailout" diagnostic. The fallback is
				 * never visible (the form renders fast
				 * enough that an empty shell is not
				 * noticeable), but the boundary is required
				 * for the build to pass.
				 */}
				<Suspense fallback={null}>
					<LoginForm />
				</Suspense>
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
