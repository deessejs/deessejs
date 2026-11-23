# `@deessejs/ui`

Theme-compatible React primitives for applications using Tailwind CSS v4 and the shadcn CSS-variable theme contract.

## Install

```sh
pnpm add @deessejs/ui
```

React is a peer dependency. The host application supplies semantic CSS variables such as `--background`, `--foreground`, `--primary`, `--border`, `--input`, `--ring`, and `--radius`, including their light and dark values.

## CSS setup

Import Tailwind first and the package source registration after it in the host's Tailwind v4 stylesheet:

```css
@import "tailwindcss";
@import "@deessejs/ui/tailwind.css";
```

The package CSS only registers the published component files with `@source`. It does not import Tailwind, define theme values, or add global styles. Keep the application's existing global CSS, theme values, and light/dark selector under application ownership.

## Components

```tsx
import { Alert, Badge, Button, Card, CardContent, Input, Label } from "@deessejs/ui"

export function Example() {
  return (
    <Card>
      <CardContent>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
        <Alert role="status">Your changes are saved.</Alert>
        <Badge>Active</Badge>
        <Button>Save changes</Button>
      </CardContent>
    </Card>
  )
}
```

The package exports `Button`, `Input`, `Label`, `Textarea`, `Card` and its subcomponents, `Badge`, `Separator`, `Alert` and its subcomponents. Components accept standard React props and `className`.

Merge utility classes through the stable `@deessejs/ui/cn` subpath:

```ts
import { cn } from "@deessejs/ui/cn"
```

Interactive components use Base UI. The public Button's `render` prop follows Base UI composition and keeps button semantics; render links as anchors styled with the same classes instead of giving an anchor button semantics.
