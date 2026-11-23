"use client"

import { useState } from "react"
import { Button } from "@deesse-admin-example/ui/components/button"
import { Input } from "@deesse-admin-example/ui/components/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@deesse-admin-example/ui/components/card"
import { client } from "@/lib/deesse-client"

export function PostsConsole() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [title, setTitle] = useState("")
  const [posts, setPosts] = useState<
    Awaited<ReturnType<typeof client.api.posts.list>>
  >([])
  const [message, setMessage] = useState(
    "Use the controls to call the Deesse runtime."
  )

  async function loadPosts() {
    try {
      const rows = await client.api.posts.list()
      setPosts(rows)
      setMessage(`Loaded ${rows.length} post${rows.length === 1 ? "" : "s"}.`)
    } catch {
      setMessage(
        "Could not load posts. Confirm the example migration was applied."
      )
    }
  }

  async function createAccount() {
    try {
      const result = await client.auth.signUp.email({
        name: email.split("@")[0] || "Example User",
        email,
        password,
      })
      setMessage(
        result.error?.message ?? "Account created. You can now sign in."
      )
    } catch {
      setMessage(
        "Account creation failed. Check the database and auth configuration."
      )
    }
  }

  async function signIn() {
    try {
      const result = await client.auth.signIn.email({ email, password })
      setMessage(
        result.error?.message ??
          "Signed in. The protected API route can now read your session."
      )
    } catch {
      setMessage("Sign in failed. Check the email and password.")
    }
  }

  async function loadSession() {
    try {
      const result = await client.api.posts.me()
      setMessage(`Authenticated as ${result.email}.`)
    } catch {
      setMessage("The request-scoped API context has no signed-in user.")
    }
  }

  async function addPost() {
    try {
      await client.api.posts.create({ title })
      setTitle("")
      await loadPosts()
    } catch {
      setMessage(
        "Could not create the post. Confirm the migration is applied and the title is valid."
      )
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          aria-label="Email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          type="email"
          value={email}
        />
        <Input
          aria-label="Password"
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        <Button onClick={createAccount} type="button" variant="secondary">
          Sign up
        </Button>
        <Button onClick={signIn} type="button">
          Sign in
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={loadSession} type="button" variant="outline">
          Check protected API
        </Button>
        <Button onClick={loadPosts} type="button" variant="outline">
          Load posts
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plugin route</CardTitle>
          <CardDescription>
            `posts.create` and `posts.list` are served by the root-level posts
            plugin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            aria-label="Post title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A short post title"
            value={title}
          />
          <Button disabled={!title.trim()} onClick={addPost} type="button">
            Create post
          </Button>
        </CardContent>
      </Card>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {message}
      </p>
      <ul className="grid gap-2">
        {posts.map((post) => (
          <li
            className="rounded-lg border bg-background px-4 py-3 text-sm"
            key={post.id}
          >
            {post.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
