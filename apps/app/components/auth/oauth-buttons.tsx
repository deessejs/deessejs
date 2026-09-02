"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { safeRedirect } from "@workspace/utils/safe-redirect"
import { GoogleIcon } from "./icons/google-icon"
import { GitHubIcon } from "./icons/github-icon"

interface OAuthButtonsProps {
	callbackURL?: string
}

export function OAuthButtons({ callbackURL = "/home" }: OAuthButtonsProps) {
	const [loading, setLoading] = useState<string | null>(null)

	async function handleOAuth(provider: "google" | "github") {
		setLoading(provider)
		// Validate callbackURL to defeat open-redirect via protocol-relative URLs
		// (//evil.com) and backslash bypass (/\\evil.com). See CVE-2025-27143.
		const safeCallback = safeRedirect(callbackURL)
		const { error } = await authClient.signIn.social({
			provider,
			callbackURL: safeCallback,
		})
		setLoading(null)

		if (error) {
			toast.error(error.message ?? "Authentication failed")
		}
		// better-auth handles the post-signIn.social redirect to callbackURL by default; no redirectPlugin() is wired (ADR-013).
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