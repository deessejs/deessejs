interface SettingsCardProps {
  title?: string
  description?: string
  children: React.ReactNode
}

export function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <div className="rounded-lg border">
      <div className="flex flex-col gap-1.5 border-b px-4 py-4">
        <h2 className="text-base font-medium">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
