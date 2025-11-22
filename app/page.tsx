'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo */}
            <Link href="/" className="flex flex-row items-center group">
              <Image
                src="/images/compass-icon-gold.svg"
                alt="Friskvårdskompassen"
                width={60}
                height={60}
                className="h-12 lg:h-16 w-auto object-contain transition-all group-hover:scale-110 group-hover:rotate-12"
                priority
              />
            </Link>

            {/* Login button */}
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gold-primary border border-gold-primary/30 rounded-lg hover:bg-gold-primary/10 transition-all duration-300"
            >
              Logga in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-96px)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center animate-fadeIn">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-primary/10 border border-gold-primary/30 rounded-full mb-8">
              <Lock className="w-4 h-4 text-gold-primary" />
              <span className="text-sm text-gold-primary font-semibold tracking-wide">
                Exklusiv Platsansökan
              </span>
            </div>

            {/* Main heading */}
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight uppercase mb-6">
              <span className="bg-gradient-to-br from-gold-light via-gold-primary to-orange-500 bg-clip-text text-transparent animate-titleGlow">
                90 Dagar
              </span>
              <br />
              <span className="text-gray-300">
                Som Förändrar Allt
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Ett exklusivt transformationsprogram för dig som är redo att ta steget.
              <span className="text-gold-primary font-semibold"> Begränsat antal platser.</span>
            </p>

            {/* CTA Button */}
            <button
              onClick={() => router.push('/apply')}
              className="group relative px-8 md:px-12 py-4 md:py-6 text-base md:text-lg font-bold tracking-[2px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary text-black rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-gold-primary/50 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-3">
                Ansök Om Plats
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Animated glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            </button>

            {/* Additional mystique text */}
            <p className="text-gray-600 text-sm mt-8 italic">
              &ldquo;Inte för alla. Bara för dem som är redo.&rdquo;
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Friskvårdskompassen. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes titleGlow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.6));
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        .animate-titleGlow {
          animation: titleGlow 3s ease-in-out infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
