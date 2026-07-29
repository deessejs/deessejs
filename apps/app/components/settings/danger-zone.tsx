interface DangerZoneProps {
  title: string
  description: string
  children: React.ReactNode
}

export function DangerZone({ title, description, children }: DangerZoneProps) {
  return (
    <div className="rounded-lg border border-destructive/50">
      <div className="flex flex-col gap-1.5 border-b border-destructive/50 bg-destructive/5 px-4 py-4">
        <h2 className="text-base font-medium text-destructive">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
