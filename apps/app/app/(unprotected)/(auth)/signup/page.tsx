import { Suspense } from "react"
import { AuthContainer, SignupForm } from "@/components/auth"

export default function SignupPage() {
	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Create account"
				description="Sign up to get started."
			/>
			<AuthContainer.Content>
				{/*
				 * `SignupForm` calls `useSearchParams` to
				 * read `?redirect=` (preserved from the
				 * login form's "Sign up" link, which is
				 * the post-email-verification destination
				 * for an invited user). Next.js bails out
				 * of static generation for any client
				 * component that reads search params
				 * without a Suspense boundary; this can
				 * fail the production build with the
				 * "missing-suspense-with-csr-bailout"
				 * diagnostic. The fallback is never
				 * visible (the form renders fast enough
				 * that an empty shell is not noticeable),
				 * but the boundary is required for the
				 * build to pass.
				 */}
				<Suspense fallback={null}>
					<SignupForm />
				</Suspense>
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}
