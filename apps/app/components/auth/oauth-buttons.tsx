"use client"

import { useOAuthSignIn } from "@/hooks/use-auth-form-mutations"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { safeRedirect } from "@workspace/utils/safe-redirect"
import { GoogleIcon } from "./icons/google-icon"
import { GitHubIcon } from "./icons/github-icon"

interface OAuthButtonsProps {
	callbackURL?: string
}

export function OAuthButtons({ callbackURL = "/home" }: OAuthButtonsProps) {
	const oauth = useOAuthSignIn()
	const loading = oauth.isPending ? oauth.variables?.provider ?? null : null

	function handleOAuth(provider: "google" | "github") {
		// Validate callbackURL to defeat open-redirect via protocol-relative URLs
		// (//evil.com) and backslash bypass (/\\evil.com). See CVE-2025-27143.
		const safeCallback = safeRedirect(callbackURL)
		oauth.mutate({ provider, callbackURL: safeCallback }, {
			onError: (error) => toast.error(error.message),
		})
		// better-auth handles the post-signIn.social redirect to callbackURL by default; no redirectPlugin() is wired.
	}

	return (
		<div className="flex flex-col gap-2">
			<Button
				variant="outline"
				type="button"
				className="w-full"
				onClick={() => handleOAuth("google")}
				disabled={!!loading}
				aria-busy={loading === "google"}
			>
				<GoogleIcon />
				{loading === "google" ? "Redirecting…" : "Continue with Google"}
			</Button>
			<Button
				variant="outline"
				type="button"
				className="w-full"
				onClick={() => handleOAuth("github")}
				disabled={!!loading}
				aria-busy={loading === "github"}
			>
				<GitHubIcon />
				{loading === "github" ? "Redirecting…" : "Continue with GitHub"}
			</Button>
		</div>
	)
}
