# TanStack Table

## Decision

**TanStack Table** (`@tanstack/react-table`) for every table that needs sort, filter, paginate, or column visibility.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

TanStack Table is used for:

- **Admin tables** (users, orgs, jobs, audit log).
- **Billing tables** (subscriptions, usage, invoices).
- **Feature tables** (notifications, blog posts, anything list-heavy).

TanStack Table is **not** used for:

- **Layout grids** (CSS Grid is enough).
- **Static tables** (no sort/filter needed) — plain HTML `<table>` is fine.

## What TanStack Table gives us

1. **Headless.** No styling opinions. We control the markup entirely.
2. **Sortable columns.** Click to sort.
3. **Filterable columns.** Per-column filter inputs.
4. **Pagination.** Cursor or offset.
5. **Column visibility.** Show/hide columns per user preference.
6. **Row selection.** Checkbox column with select-all.
7. **Column resizing.** Drag column borders to resize.
8. **Virtualization.** For very large datasets (via `@tanstack/react-virtual`).
9. **Type-safe.** Generics infer the row shape.

## Why TanStack Table (not AG Grid, not MUI DataGrid, not react-table legacy)

| Alternative | Why not |
|---|---|
| **AG Grid** | Enterprise-grade, paid license for full features. Overkill for SaaS templates. |
| **MUI DataGrid** | Material design opinions. Heavy. |
| **react-table v7** | Same as TanStack Table v8; rebranded. |
| **Plain HTML table + custom code** | We reinvent TanStack Table badly for any non-trivial table. |
| **Notion-style blocks** | Wrong UX for admin tables. |

TanStack Table wins on:

- **Headless** — fits our Tailwind + shadcn stack perfectly.
- **Type-safe** — TypeScript generics work end-to-end.
- **Composable** — only use the features we need.
- **Free and active** — large community.

## Pattern

```tsx
'use client';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import type { Project } from '@deessejs/db/schema';

interface ProjectsTableProps {
  data: Project[];
}

export function ProjectsTable({ data }: ProjectsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Styling

TanStack Table doesn't ship styles. We use **shadcn `Table` components** as the base, with Tailwind classes for layout.

The pattern:

- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@deessejs/ui/table` (shadcn).
- TanStack Table's logic drives the rendering via `flexRender`.

## Performance

- For tables with >1000 rows, use `@tanstack/react-virtual` to render only visible rows.
- For server-side pagination, fetch the page via TanStack Query, pass to TanStack Table.
- Memoize column definitions with `useMemo` to avoid re-creating on every render.

## Constraints

- **TanStack Table is headless.** Don't import its CSS. Style with Tailwind + shadcn.
- **Server-side pagination is the default** for tables backed by APIs (per feature 7.7).
- **Column definitions typed** with the row shape via generics.
- **No sorting on the server** unless the API supports it (we do — feature 7.9).

## Cross-references

- [`./tanstack-query.md`](./tanstack-query.md) — data fetching for tables backed by APIs.
- [`./tailwind-shadcn.md`](./tailwind-shadcn.md) — the styling layer for tables.
- [`../../product/features/10-ui.md`](../../product/features/10-ui.md) — UI feature inventory (10.7).
