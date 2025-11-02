export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">90-Dagars Challenge</h1>
            <p className="text-muted-foreground">
              Bygg din personliga plan på 8 steg
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
