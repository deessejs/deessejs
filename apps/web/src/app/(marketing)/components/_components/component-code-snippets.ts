/**
 * V1 stub snippets for the Code tab on each
 * `/components/[category]/[component]` page. Each entry is a
 * small shadcn usage example suitable for copy-paste. The map is
 * exhaustive: the trailing `satisfies` check turns a missing slug
 * into a compile error.
 *
 * V2 will replace these with the real source from
 * `packages/ui/src/components/<slug>.tsx` (parsed and reformatted).
 */

import type { CatalogueComponent } from "./components-list"

const SNIPPETS = {
  button: `import { Button } from "@workspace/ui/components/button"

export function Example() {
  return <Button>Click me</Button>
}`,
  badge: `import { Badge } from "@workspace/ui/components/badge"

export function Example() {
  return <Badge>New</Badge>
}`,
  separator: `import { Separator } from "@workspace/ui/components/separator"

export function Example() {
  return (
    <div>
      <p>Above</p>
      <Separator className="my-4" />
      <p>Below</p>
    </div>
  )
}`,
  skeleton: `import { Skeleton } from "@workspace/ui/components/skeleton"

export function Example() {
  return <Skeleton className="h-12 w-48" />
}`,
  avatar: `import { Avatar } from "@workspace/ui/components/avatar"

export function Example() {
  return <Avatar>Fallback</Avatar>
}`,
  input: `import { Input } from "@workspace/ui/components/input"

export function Example() {
  return <Input type="email" placeholder="you@deessejs.com" />
}`,
  textarea: `import { Textarea } from "@workspace/ui/components/textarea"

export function Example() {
  return <Textarea placeholder="Tell us more…" />
}`,
  checkbox: `import { Checkbox } from "@workspace/ui/components/checkbox"

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <label htmlFor="terms">Accept terms</label>
    </div>
  )
}`,
  select: `import { Select } from "@workspace/ui/components/select"

export function Example() {
  return <Select placeholder="Pick one" />
}`,
  switch: `import { Switch } from "@workspace/ui/components/switch"

export function Example() {
  return <Switch />
}`,
  "input-group": `import { InputGroup } from "@workspace/ui/components/input-group"

export function Example() {
  return <InputGroup /> // wraps an Input with addons or trailing buttons`,
  dialog: `import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"

export function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    </Dialog>
  )
}`,
  sheet: `import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@workspace/ui/components/sheet"

export function Example() {
  return (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetTitle>Title</SheetTitle>
      </SheetContent>
    </Sheet>
  )
}`,
  popover: `import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/popover"

export function Example() {
  return (
    <Popover>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>Content</PopoverContent>
    </Popover>
  )
}`,
  tooltip: `import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@workspace/ui/components/tooltip"

export function Example() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}`,
  "dropdown-menu": `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"

export function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
  command: `import { Command } from "@workspace/ui/components/command"

export function Example() {
  return <Command /> // search palette / command menu`,
  "navigation-menu": `import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu"

export function Example() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Item</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`,
  sidebar: `import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
} from "@workspace/ui/components/sidebar"

export function Example() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>{/* nav */}</SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}`,
  breadcrumb: `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@workspace/ui/components/breadcrumb"

export function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`,
  accordion: `import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/ui/components/accordion"

export function Example() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="q">
        <AccordionTrigger>Question</AccordionTrigger>
        <AccordionContent>Answer</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
  collapsible: `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"

export function Example() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>Hidden content</CollapsibleContent>
    </Collapsible>
  )
}`,
  tabs: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"

export function Example() {
  return (
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A</TabsContent>
    </Tabs>
  )
}`,
  sonner: `import { toast } from "@workspace/ui/components/sonner"

export function Example() {
  return <button onClick={() => toast("Saved")}>Save</button>
  // Note: Sonner exposes a toast() function, not a component
}`,
} as const satisfies Record<CatalogueComponent["slug"], string>

export function getComponentSnippet(slug: CatalogueComponent["slug"]): string {
  // See block-code-snippets.ts for the rationale on this cast —
  // `as const satisfies Record<...>` makes the type exact with no
  // index signature, so a direct access requires widening.
  return (SNIPPETS as Record<string, string>)[slug]
}