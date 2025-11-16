import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
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
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
