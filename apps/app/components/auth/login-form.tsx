"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Separator } from "@workspace/ui/components/separator"
import { OAuthButtons } from "./oauth-buttons"
import { Field, PasswordField } from "./field"
import { loginSchema } from "@/components/auth/schemas"

export function LoginForm() {
	const router = useRouter()

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email(value, {
				onSuccess: () => router.push("/home"),
			})
			if (error) {
				toast.error(error.message ?? "Invalid credentials")
			}
		},
	})

	return (
		<div className="flex flex-col gap-6">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				noValidate
				className="flex flex-col gap-4"
			>
				<Field
					form={form}
					name="email"
					label="Email"
					type="email"
					autoComplete="email"
					autoFocus
				/>

				<PasswordField
					form={form}
					name="password"
					label="Password"
					autoComplete="current-password"
					labelAside={
						<Link
							href="/forgot-password"
							className="text-sm text-primary underline-offset-4 hover:underline"
						>
							Forgot password?
						</Link>
					}
				/>

				<div className="flex items-center gap-2">
					<Checkbox id="remember" name="remember" />
					<label htmlFor="remember" className="text-sm font-normal">
						Remember me
					</label>
				</div>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting] as const}
					children={([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>
							{isSubmitting ? "Signing in…" : "Sign in"}
						</Button>
					)}
				/>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<Separator className="w-full" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>

			<OAuthButtons />

			<p className="text-center text-sm text-muted-foreground">
				Don&apos;t have an account?{" "}
				<Link href="/signup" className="text-primary underline-offset-4 hover:underline">
					Sign up
				</Link>
			</p>
		</div>
	)
}