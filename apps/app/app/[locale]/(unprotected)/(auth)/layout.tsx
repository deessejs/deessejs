export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}