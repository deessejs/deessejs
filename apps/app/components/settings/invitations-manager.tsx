"use client"

import { useState, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { SettingsCard } from "./settings-card"
import { inviteMember, revokeInvitation } from "@/lib/organization-invitations"

interface InvitationRow {
	id: string
	email: string
	role: string
	status: string
	expiresAt: string
}

interface InvitationsManagerProps {
	organizationId: string
	organizationSlug: string
	initialInvitations: InvitationRow[]
}

/**
 * Manager for pending invitations. The form lets an admin invite
 * a new email; the table lists pending invitations with a
 * revoke button. Both actions go through Server Actions in
 * `apps/app/lib/organization-invitations.ts`, which call
 * `auth.api.createInvitation` and `auth.api.cancelInvitation`
 * after role-checking.
 */
export function InvitationsManager({
	organizationId,
	organizationSlug,
	initialInvitations,
}: InvitationsManagerProps) {
	const [invitations, setInvitations] =
		useState<InvitationRow[]>(initialInvitations)
	const [email, setEmail] = useState("")
	const [role, setRole] = useState<"member" | "admin">("member")
	const [error, setError] = useState<string | null>(null)
	const [inviting, startInviting] = useTransition()
	const [revokingId, setRevokingId] = useState<string | null>(null)

	function onInvite(event: React.FormEvent) {
		event.preventDefault()
		setError(null)
		startInviting(async () => {
			const result = await inviteMember({
				organizationSlug,
				email: email.trim(),
				role,
			})
			if (!result.ok) {
				setError(result.error)
				return
			}
			setInvitations((prev) => [
				...prev,
				{
					id: result.invitationId,
					email: email.trim(),
					role,
					status: "pending",
					expiresAt: result.expiresAt,
				},
			])
			setEmail("")
		})
	}

	function onRevoke(id: string) {
		setError(null)
		setRevokingId(id)
		void (async () => {
			const result = await revokeInvitation({
				organizationSlug,
				invitationId: id,
			})
			setRevokingId(null)
			if (!result.ok) {
				setError(result.error)
				return
			}
			setInvitations((prev) => prev.filter((i) => i.id !== id))
		})()
	}

	return (
		<div className="flex flex-col gap-4">
			<SettingsCard
				title="Invite a member"
				description="They will receive an email with an acceptance link."
			>
				<form
					onSubmit={onInvite}
					className="flex flex-col gap-3 sm:flex-row sm:items-end"
				>
					<label className="flex flex-1 flex-col gap-1 text-sm">
						<span className="font-medium">Email</span>
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="teammate@example.com"
							required
							disabled={inviting}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span className="font-medium">Role</span>
						<select
							value={role}
							onChange={(e) =>
								setRole(e.target.value as "member" | "admin")
							}
							disabled={inviting}
							className="rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="member">Member</option>
							<option value="admin">Admin</option>
						</select>
					</label>
					<Button type="submit" disabled={inviting || !email.trim()}>
						{inviting ? "Sending…" : "Send invitation"}
					</Button>
				</form>
				{error && (
					<p className="mt-2 text-sm text-destructive" role="alert">
						{error}
					</p>
				)}
			</SettingsCard>

			<SettingsCard
				title="Pending invitations"
				description="Invitations that have not been accepted yet."
			>
				{invitations.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No pending invitations.
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{invitations.map((i) => (
							<li
								key={i.id}
								className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
							>
								<div className="flex flex-col">
									<span className="font-medium">{i.email}</span>
									<span className="text-xs text-muted-foreground">
										Role: {i.role} · expires{" "}
										{new Date(i.expiresAt).toLocaleDateString()}
									</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onRevoke(i.id)}
									disabled={revokingId === i.id}
								>
									{revokingId === i.id ? "Revoking…" : "Revoke"}
								</Button>
							</li>
						))}
					</ul>
				)}
			</SettingsCard>
		</div>
	)
}
