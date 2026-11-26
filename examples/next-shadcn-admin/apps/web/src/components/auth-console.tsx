"use client"

import { useState } from "react"
import { Button } from "@deesse-admin-example/ui/components/button"
import { Input } from "@deesse-admin-example/ui/components/input"
import { client } from "@/lib/deesse-client"

export function AuthConsole() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("Sign in to open the administrator dashboard.")

  async function signUp() {
    try {
      const result = await client.auth.signUp.email({
        name: email.split("@")[0] || "Example User",
        email,
        password,
      })
      setMessage(result.error?.message ?? "Account created. Sign in to continue.")
    } catch {
      setMessage("Account creation failed. Check the email and password.")
    }
  }

  async function signIn() {
    try {
      const result = await client.auth.signIn.email({ email, password })
      setMessage(result.error?.message ?? "Signed in. Open the admin dashboard to manage posts.")
    } catch {
      setMessage("Sign in failed. Check the email and password.")
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <Input aria-label="Email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} />
        <Input aria-label="Password" autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" value={password} />
        <Button onClick={signUp} type="button" variant="secondary">Sign up</Button>
        <Button onClick={signIn} type="button">Sign in</Button>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
