"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { API_BASE_PATH } from "@workspace/api/base-path"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { client } from "@/lib/client"

type VercelStatus = {
  connection: {
    accountName: string
    accountType: string
    connectedAt: string
  } | null
  canManage: boolean
  appConfigured: boolean
}

const messages: Record<string, string> = {
  connected: "Vercel is connected to this organization.",
  cancelled: "Vercel connection was cancelled.",
  reauthenticate: "Your session expired. Sign in and connect Vercel again.",
  notConfigured: "Vercel integration credentials are not configured here.",
  error: "Vercel could not be connected. Try again.",
}

export function VercelIntegration({
  slug,
  status,
  result,
}: {
  slug: string
  status: VercelStatus
  result: string | undefined
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  function connect() {
    setPending(true)
    const url = new URL(
      `${API_BASE_PATH}/vercel/oauth/start`,
      window.location.origin
    )
    url.searchParams.set("slug", slug)
    window.location.assign(url.toString())
  }

  async function disconnect() {
    setPending(true)
    try {
      await client.rpc.vercel.disconnect({ slug })
      toast.success("Vercel was disconnected from this organization")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not disconnect Vercel"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vercel</CardTitle>
        <CardDescription>
          Connect an existing Vercel account or team, then map each DeesseJS
          project to a Vercel project. DeesseJS only reads project details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {result && messages[result] ? (
          <p role="status" className="text-sm text-muted-foreground">
            {messages[result]}
          </p>
        ) : null}
        {status.connection ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              Connected to {status.connection.accountName}
            </p>
            <p className="text-sm text-muted-foreground">
              Vercel {status.connection.accountType} account
            </p>
            {status.canManage ? (
              <p className="text-xs text-muted-foreground">
                Disconnecting removes the local connection and project mappings.
                It does not remove the integration from Vercel.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Vercel account is connected.
          </p>
        )}
        {status.canManage ? (
          !status.appConfigured ? (
            <p className="text-sm text-muted-foreground">
              Vercel integration credentials are not configured on this
              environment.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={connect} disabled={pending}>
                {status.connection ? "Reconnect Vercel" : "Connect Vercel"}
              </Button>
              {status.connection ? (
                <Button
                  variant="outline"
                  onClick={() => void disconnect()}
                  disabled={pending}
                >
                  Disconnect
                </Button>
              ) : null}
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
