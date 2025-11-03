export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a] p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
