"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

export function useAdminTemplatePublicationDecision() {
  return useMutation({
    // The moderation queue is server-rendered; its owner calls router.refresh()
    // after success, so there is no TanStack Query cache for this mutation.
    mutationFn: async ({ publicationId, decision, reason }: { publicationId: string; decision: "approve" | "reject"; reason?: string }) => {
      if (decision === "approve") return client.rpc.admin.templates.publications.approve({ publicationId })
      return client.rpc.admin.templates.publications.reject({ publicationId, reason: reason ?? "" })
    },
  })
}

export function useAdminBlockPublicationDecision() {
  return useMutation({
    // The moderation queue is server-rendered; its owner calls router.refresh()
    // after success, so there is no TanStack Query cache for this mutation.
    mutationFn: async ({ publicationId, approve, reason }: { publicationId: string; approve: boolean; reason: string }) => {
      if (approve) return client.rpc.admin.templates.blockPublications.approve({ publicationId, reason: reason || null })
      return client.rpc.admin.templates.blockPublications.reject({ publicationId, reason })
    },
  })
}

export function useCreateOfficialBlock() {
  return useMutation({
    // The official block catalog is server-rendered; the dialog owner calls
    // router.refresh() after success, so no TanStack Query cache is affected.
    mutationFn: (values: Parameters<typeof client.rpc.admin.blocks.createOfficial>[0]) => client.rpc.admin.blocks.createOfficial(values),
  })
}
