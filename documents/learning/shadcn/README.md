# shadcn/ui — Learning & Reference

Internal documentation for our UI component stack, based on
[shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4.

## What is shadcn/ui?

It is **not** a traditional component library. It is a system that copies the
component code directly into your project, so you can modify anything you want.
Under the hood: Radix UI for accessibility, Tailwind CSS for styling, and CSS
variables for theming.

The five founding principles: **Open Code**, **Composition**, **Distribution**,
**Beautiful Defaults**, **AI-Ready**.

## Our stack

- **Tailwind CSS v4** — utility-first, CSS-first configuration (`@theme inline`)
- **shadcn/ui** — accessible components (Radix primitives), copied locally
- **TypeScript** — strict, no JavaScript in our projects
- **Icons** — `lucide-react`

## Project conventions

- **Component style** — `new-york` (the `default` style is deprecated)
- **Base color** — `neutral` (only changeable at init)
- **CSS variables** — enabled (recommended, default)
- **Registries** — `@shadcn` (official), `@acme` (internal, coming)

## Getting started with shadcn/ui

1. Read the [philosophy](https://ui.shadcn.com/docs) (5 min)
2. Pick your framework in the [installation docs](https://ui.shadcn.com/docs/installation)
3. Run `npx shadcn@latest init`
4. Add your first components: `npx shadcn@latest add button card dialog`

## Component catalog (60+)

- **Form & Input** — Button, Input, Textarea, Checkbox, Radio Group, Select,
  Native Select, Switch, Slider, Combobox, Calendar, Date Picker, Input OTP,
  Input Group, Field, Label, Form, Button Group
- **Layout & Navigation** — Accordion, Breadcrumb, Navigation Menu, Sidebar,
  Tabs, Separator, Scroll Area, Resizable
- **Overlays & Dialogs** — Dialog, Alert Dialog, Sheet, Drawer, Popover,
  Tooltip, Hover Card, Context Menu, Dropdown Menu, Menubar, Command
- **Feedback & Status** — Alert, Toast, Sonner, Progress, Spinner, Skeleton,
  Badge, Empty
- **Display & Media** — Avatar, Card, Table, Data Table, Chart, Carousel,
  Aspect Ratio, Typography, Item, Kbd
- **Misc** — Collapsible, Toggle, Toggle Group, Pagination, Direction

See every component in detail at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

## Resources

- Official site — <https://ui.shadcn.com>
- GitHub — <https://github.com/shadcn-ui/ui>
- llms.txt (machine-readable index) — <https://ui.shadcn.com/llms.txt>
- Changelog — <https://ui.shadcn.com/docs/changelog>
- Tailwind CSS v4 — <https://tailwindcss.com/docs>