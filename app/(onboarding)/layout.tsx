import Link from 'next/link'
import Image from 'next/image'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center justify-center group">
            <Image
              src="/images/logo-white.svg"
              alt="90-Dagars Utmaningen"
              width={240}
              height={50}
              className="h-10 w-auto object-contain transition-all group-hover:opacity-80"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-300 text-lg">
              Bygg din personliga plan på 8 steg
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
