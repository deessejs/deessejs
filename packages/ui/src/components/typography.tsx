export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-3xl font-bold tracking-tight first:mt-0">
      {children}
    </h1>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  )
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h3>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xl">{children}</p>
}

export function Small({ children }: { children: React.ReactNode }) {
  return <small className="text-sm font-medium leading-none">{children}</small>
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>
}

export function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">
      {children}
    </blockquote>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
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
      className="text-foreground underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </a>
  )
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="my-6 ml-6 list-disc space-y-2">{children}</ul>
}

export function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="my-6 ml-6 list-decimal space-y-2">{children}</ol>
}

export function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>
}
