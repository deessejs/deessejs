"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Checkbox } from "@workspace/ui/components/ui/checkbox"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"
import { Separator } from "@workspace/ui/components/ui/separator"

/**
 * SignupCard — auth form for /signup.
 *
 * UI-complete (name + email + password, terms checkbox, social buttons,
 * link to /login) but has NO backend wiring: submit is intercepted with
 * preventDefault and surfaces an explicit "Backend not connected yet"
 * error so the user knows this is a preview. Wire to Better Auth /
 * server action when ready.
 */
export function SignupCard() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!acceptTerms) {
      setError("You must accept the terms to create an account.")
      return
    }
    setSubmitting(true)
    // Simulate the request lifecycle so the UI feels real.
    window.setTimeout(() => {
      setSubmitting(false)
      setError("Backend not connected yet.")
    }, 600)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start shipping in minutes. Free during beta — no credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(value) => setAcceptTerms(value === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="cursor-pointer text-sm leading-snug font-normal text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" className="text-foreground underline-offset-4 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-foreground underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-10 w-full"
            disabled={submitting}
            nativeButton
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-xs uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled
            nativeButton
          >
            <SiGoogle size={16} aria-hidden />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled
            nativeButton
          >
            <SiGithub size={16} aria-hidden />
            GitHub
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="ml-1 font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
