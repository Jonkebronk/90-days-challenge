export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gold-primary mb-2">90-Dagars Challenge</h1>
            <p className="text-gray-400">
              Bygg din personliga plan på 8 steg
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
