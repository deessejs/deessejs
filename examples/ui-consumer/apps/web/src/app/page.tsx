import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@deessejs/ui"

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-start gap-8 px-6 py-16">
      <header className="grid gap-3">
        <Badge className="w-fit">Standalone consumer</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Public UI package</h1>
        <p className="max-w-2xl text-muted-foreground">
          This Next.js app imports the workspace package and supplies its own shadcn theme tokens.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Share an update</CardTitle>
          <CardDescription>A small form built from @deessejs/ui primitives.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Ada Lovelace" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="What are you working on?" rows={3} />
          </div>
          <Alert>
            <AlertTitle>Theme ownership</AlertTitle>
            <AlertDescription>The host app defines all color, radius, and light/dark values.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">Workspace package example</span>
          <Button>Post update</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
