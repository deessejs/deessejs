"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

export function useCreateAdminTemplate() {
  return useMutation({
    // Admin template listings are server-rendered; the caller refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.admin.templates.create>[0]) => client.rpc.admin.templates.create(input),
  })
}
export function useCreateOrganizationTemplate() {
  return useMutation({
    // Organization template listings are server-rendered; the caller refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.organization.templates.create>[0]) => client.rpc.organization.templates.create(input),
  })
}
export function useSubmitOrganizationTemplate() {
  return useMutation({
    // Submission state is server-rendered; the dialog owner refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.organization.templates.submit>[0]) => client.rpc.organization.templates.submit(input),
  })
}
export function useWithdrawOrganizationTemplate() {
  return useMutation({
    // Publication state is server-rendered; the caller refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.organization.templates.withdraw>[0]) => client.rpc.organization.templates.withdraw(input),
  })
}
export function useCreateOrganizationBlock() {
  return useMutation({
    // Organization block listings are server-rendered; the caller refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.organization.blocks.create>[0]) => client.rpc.organization.blocks.create(input),
  })
}
export function useSubmitOrganizationBlock() {
  return useMutation({
    // Submission state is server-rendered; the dialog owner refreshes the route.
    mutationFn: (input: Parameters<typeof client.rpc.organization.blocks.submit>[0]) => client.rpc.organization.blocks.submit(input),
  })
}
