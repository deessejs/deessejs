"use client"

import { useState, type FormEvent } from "react"
import { useMemberManagement } from "@/hooks/use-member-management"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function MemberManagement({
  organizationId,
  slug,
  canManage,
}: {
  organizationId: string
  slug: string
  canManage: boolean
}) {
  const [email, setEmail] = useState("")
  const { query, invite, cancel } = useMemberManagement(organizationId, slug, canManage)
  const members = query.data?.members ?? []
  const invitations = query.data?.invitations ?? []
  const displayedFailure = query.error?.message ?? invite.error?.message ?? cancel.error?.message

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = email.trim()
    if (!address) return
    invite.mutate({ email: address }, { onSuccess: () => { setEmail(""); toast.success("Invitation sent") } })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          See who belongs to this organization and manage invitations.
        </p>
      </header>

      {displayedFailure && (
        <p className="text-sm text-destructive" role="alert">
          {displayedFailure}
        </p>
      )}

      {canManage && (
        <section className="rounded-lg border p-4">
          <h2 className="text-base font-medium">Invite a member</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            They will join as a member after accepting the invitation.
          </p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleInvite}>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="member-email">Email address</Label>
              <Input
                id="member-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Roster</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        {query.isPending ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pending invitations</h2>
            <p className="text-sm text-muted-foreground">
              Invitations expire after 48 hours. Resending starts a new 48-hour period.
            </p>
          </div>
          {query.isPending ? (
            <p className="text-sm text-muted-foreground">Loading invitations…</p>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">There are no pending invitations.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {invitations.map((invitation) => {
                return (
                  <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.inviterName} · Expires {new Date(invitation.expiresAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={invite.isPending || cancel.isPending}
                        onClick={() => invite.mutate({ email: invitation.email, resend: true }, { onSuccess: () => toast.success("Invitation resent") })}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={invite.isPending || cancel.isPending}
                        onClick={() => cancel.mutate(invitation.id, { onSuccess: () => toast.success("Invitation canceled") })}
                      >
                        Cancel
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
