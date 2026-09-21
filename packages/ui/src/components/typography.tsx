export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance lg:text-left lg:text-5xl">
      {children}
    </h1>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  )
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h3>
  )
}

export function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-7 not-first:mt-6">{children}</p>
  )
}

export function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">
      {children}
    </blockquote>
  )
}

export function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
  )
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xl">{children}</p>
  )
}

export function Large({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-lg font-semibold">{children}</div>
  )
}

export function Small({ children }: { children: React.ReactNode }) {
  return (
    <small className="text-sm font-medium leading-none">{children}</small>
  )
}

export function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-sm">{children}</p>
  )
}

export function Link({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      className="font-medium underline underline-offset-4"
    >
      {children}
    </a>
  )
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

export function Em({ children }: { children: React.ReactNode }) {
  return <em className="text-foreground/90">{children}</em>
}

export function Hr() {
  return <hr className="border-border/40 my-8" />
}

export function Img({
  src,
  alt,
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={cn(
        "rounded-lg border border-border/40 my-4 max-w-full h-auto",
        className,
      )}
    />
  )
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 w-full overflow-y-auto rounded-lg border">
      <table className="w-full">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>
}

export function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </th>
  )
}

export function TD({ children }: { children: React.ReactNode }) {
  return (
    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </td>
  )
}

// cn helper — imported at the top of the file. Since typography.tsx
// currently has no imports, the helper is added in-place below to
// keep the file dependency-free (the @workspace/ui build pulls in
// only React + class-variance utilities).
function cn(...inputs: Array<string | undefined | null | false>): string {
  return inputs.filter(Boolean).join(" ")
}
