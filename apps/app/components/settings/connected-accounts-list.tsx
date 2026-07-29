"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog"
import { GoogleIcon } from "@/components/auth/icons/google-icon"
import { GitHubIcon } from "@/components/auth/icons/github-icon"

interface LinkedAccount {
	id: string
	providerId: string
	accountId: string
}

const PROVIDER_INFO: Record<
	string,
	{ name: string; Icon: React.ComponentType<{ className?: string }> }
> = {
	google: { name: "Google", Icon: GoogleIcon },
	github: { name: "GitHub", Icon: GitHubIcon },
}

export function ConnectedAccountsList() {
	const [accounts, setAccounts] = useState<LinkedAccount[]>([])
	const [loading, setLoading] = useState(true)
	const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
	const [unlinkConfirm, setUnlinkConfirm] = useState<{ id: string; provider: string } | null>(null)
	const [linking, setLinking] = useState<string | null>(null)

	const loadAccounts = useCallback(async () => {
		setLoading(true)
		const { data, error } = await authClient.listAccounts()
		setLoading(false)

		if (error || !data) {
			setAccounts([])
			return
		}

		setAccounts(
			data.map((a) => ({
				id: a.id,
				providerId: a.providerId,
				accountId: a.accountId,
			})),
		)
	}, [])

	useEffect(() => {
		// Valid: loading data on mount requires setState
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadAccounts()
	}, [loadAccounts])

	async function handleLink(provider: string) {
		setLinking(provider)
		try {
			await authClient.linkSocial({ provider })
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to link account"
			toast.error(message)
		} finally {
			setLinking(null)
		}
	}

	async function handleUnlink() {
		if (!unlinkConfirm) return
		setUnlinkingId(unlinkConfirm.id)

		const { error } = await authClient.unlinkAccount({
			accountId: unlinkConfirm.id,
			providerId: unlinkConfirm.provider,
		})
		setUnlinkingId(null)
		setUnlinkConfirm(null)

		if (error) {
			toast.error(error.message ?? "Failed to unlink account")
			return
		}

		setAccounts((prev) => prev.filter((a) => a.id !== unlinkConfirm.id))
	}

	return (
		<div className="flex flex-col gap-4">
			{loading && accounts.length === 0 && (
				<p className="text-sm text-muted-foreground">Loading linked accounts…</p>
			)}
			{!loading && accounts.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Linked accounts</p>
					{accounts.map((account) => {
						const info = PROVIDER_INFO[account.providerId] ?? {
							name: account.providerId,
							Icon: () => <span className="text-xs font-bold">{account.providerId.slice(0, 2).toUpperCase()}</span>,
						}
						return (
							<div
								key={account.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex items-center gap-3">
									<div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
										<info.Icon className="size-4" />
									</div>
									<div>
										<p className="text-sm font-medium">{info.name}</p>
										<p className="text-xs text-muted-foreground">{account.accountId}</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setUnlinkConfirm({ id: account.id, provider: account.providerId })}
									disabled={unlinkingId === account.id}
								>
									{unlinkingId === account.id ? "Unlinking…" : "Unlink"}
								</Button>
							</div>
						)
					})}
				</div>
			)}

			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">Link a new account</p>
				<div className="flex gap-2">
					{(["google", "github"] as const).map((provider) => {
						const isLinked = accounts.some((a) => a.providerId === provider)
						const info = PROVIDER_INFO[provider]
						return (
							<Button
								key={provider}
								variant="outline"
								size="sm"
								onClick={() => handleLink(provider)}
								disabled={isLinked || linking === provider}
							>
								{linking === provider ? "Linking…" : `Link ${info?.name ?? provider}`}
							</Button>
						)
					})}
				</div>
			</div>

			<Dialog
				open={!!unlinkConfirm}
				onOpenChange={(open) => !open && setUnlinkConfirm(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Unlink {unlinkConfirm ? PROVIDER_INFO[unlinkConfirm.provider]?.name ?? unlinkConfirm.provider : ""}?</DialogTitle>
						<DialogDescription>
							You will no longer be able to sign in with this account.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setUnlinkConfirm(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleUnlink} disabled={!!unlinkingId}>
							{unlinkingId ? "Unlinking…" : "Unlink"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
