"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@deessejs/ui/components/button"

import { signOut } from "@/lib/auth-client"

/**
 * Sign out button. Calls Better Auth's `/api/auth/sign-out` via the
 * client, then redirects to `/login`. We use `fetchOptions.onSuccess`
 * for the post-signout redirect — Better Auth's `signOut()` doesn't
 * take a redirect param directly.
 */
export function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string
  variant?: "outline" | "ghost" | "default"
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const onClick = async () => {
    setPending(true)
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        },
      },
    })
    // signOut() rarely throws — but if it does, we still want to
    // send the user away. setPending(false) keeps the button clickable
    // in case Better Auth didn't actually clear the session.
    setPending(false)
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      disabled={pending}
      className={className}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
