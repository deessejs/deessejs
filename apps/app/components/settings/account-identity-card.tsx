import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { UserRoundIcon } from "lucide-react"

import { getInitials } from "@/lib/initials"
import { SettingsCard } from "./settings-card"

interface AccountIdentity {
  name: string
  email: string
  emailVerified: boolean
  image?: string | null | undefined
}

export function AccountIdentityCard({
  user,
}: {
  user: AccountIdentity
}) {
  return (
    <SettingsCard
      title="Your account"
      description="The personal identity associated with your sign-in."
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarImage src={user.image ?? undefined} alt="" />
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.emailVerified ? "Email verified" : "Email not verified"}
          </p>
        </div>
        <UserRoundIcon
          aria-hidden
          className="ml-auto hidden size-5 text-muted-foreground sm:block"
        />
      </div>
    </SettingsCard>
  )
}
