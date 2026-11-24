import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@deessejs/ui"

export function AdminOverview() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Your admin dashboard is ready</CardTitle>
        <CardDescription>Your workspace</CardDescription>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        Pages configured by your application appear in this dashboard.
      </CardContent>
    </Card>
  )
}
