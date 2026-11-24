import { z } from "zod"

/** Current organizations and roles visible to the authenticated DeesseJS user. */
export const MyOrganizationsListResponseV1 = z.object({
  organizations: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      logo: z.string().nullable(),
      role: z.string(),
    })
  ),
})

export type MyOrganizationsListResponseV1 = z.infer<
  typeof MyOrganizationsListResponseV1
>
