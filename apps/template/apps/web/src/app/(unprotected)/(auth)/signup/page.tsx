import Link from "next/link"

import { SignupForm } from "@/components/auth/signup-form"

/**
 * Signup page. URL: /signup.
 *
 * Server component shell: heading + subheading + the client-side form
 * (validation + submit state) + the "Log in" link. The two-column
 * split lives in the parent (auth)/layout.tsx.
 */
export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Get started in seconds. No credit card required.
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}
