---
name: feedback-pierre-grid-layout
description: Pierre Trees and Diffs hosts need explicit min-h-0 + h-full in grid layout — default block children collapse to 0px
metadata:
  type: feedback
---

When using `@pierre/trees` `<FileTree>` and `@pierre/diffs` `<File>` inside a CSS Grid layout, the wrapping divs around the Pierre hosts MUST have `h-full min-h-0`. Otherwise the cells render as 0px tall and nothing shows.

**The bug** (hit 2026-06-25 on the InteractiveFiletree):
```tsx
// WRONG — wrapping divs default to display:block, height = content height = 0
<div className="grid h-[420px] md:grid-cols-[280px_1fr]">
  <div className="bg-muted/10 overflow-hidden">      {/* 0px tall! */}
    <FileTree model={model} className="h-full w-full" />
  </div>
  <div className="bg-background overflow-hidden">   {/* 0px tall! */}
    <File file={file} ... />
  </div>
</div>
```

The grid container is 420px tall and grid items default to `align-self: stretch`, so the cell area is 420px. But the inner divs are `display: block` — they take content height, not parent height. So they're 0px tall. The Pierre hosts inside them inherit 0px height, even with `h-full`, because percentage heights resolve against a parent that has no definite height.

**The fix**:
```tsx
// RIGHT — wrapping divs explicitly fill the grid cell
<div className="grid h-[420px] md:grid-cols-[280px_1fr]">
  <div className="h-full min-h-0 bg-muted/10 overflow-hidden">
    <FileTree model={model} className="h-full min-h-0 w-full" />
  </div>
  <div className="h-full min-h-0 bg-background overflow-hidden">
    <File file={file} ... />
  </div>
</div>
```

**Why `min-h-0` matters**:
- Grid items have `min-height: auto` by default, which means they refuse to shrink below content size
- Without `min-h-0`, even with `h-full`, the cell might overflow or not size correctly in nested grid/flex contexts
- Always add `min-h-0` when using percentage heights in grid/flex containers

**Pierre docs example uses explicit pixel height**:
```tsx
<FileTree model={model} style={{ height: '320px' }} className="rounded-lg border" />
```

This works because the host gets a definite pixel height. We could use this pattern instead of `h-full`, but `h-full min-h-0` is more flexible for responsive layouts.

**When to apply**: any time Pierre components are nested in grid/flex containers, the immediate wrapping div needs `h-full min-h-0`, AND the Pierre host itself needs `h-full min-h-0 w-full` to propagate the height through.