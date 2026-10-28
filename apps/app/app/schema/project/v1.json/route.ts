import projectSchema from "@workspace/registry/schema/project/v1.json"

export const dynamic = "force-static"

export function GET() {
  return Response.json(projectSchema, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
