import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@deessejs/ui"

export function PostsAdminPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Posts administration</CardTitle>
        <CardDescription>Content</CardDescription>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        This page is statically included and configured by the application.
      </CardContent>
    </Card>
  )
}
