'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CountdownTimer } from '@/components/countdown-timer'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]" />

      {/* Animated particles */}
      <div className="particles absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="particle absolute w-[2px] h-[2px] bg-[rgba(255,215,0,0.3)] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Portal links */}
      <div className="absolute top-[30px] right-[30px] z-20 flex flex-col items-end gap-2">
        <Link
          href="/login"
          className="text-sm text-[rgba(255,215,0,0.7)] hover:text-[#FFD700] transition-all duration-300 tracking-wide font-light hover:-translate-x-1"
        >
          Client Portal →
        </Link>
        <Link
          href="/login"
          className="text-sm text-[rgba(255,215,0,0.5)] hover:text-[rgba(255,215,0,0.8)] transition-all duration-300 tracking-wide font-light hover:-translate-x-1"
        >
          Coach Portal →
        </Link>
      </div>

      {/* Main container */}
      <div className="relative z-10 text-center px-10 py-10 max-w-[600px] animate-fadeIn">
        {/* Title */}
        <div className="mb-[50px]">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-5 animate-shimmer" />
          <h1 className="font-['Orbitron',sans-serif] text-5xl font-black tracking-[6px] leading-[1.2] uppercase animate-titleGlow bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            90-DAGARS
            <br />
            CHALLENGE
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-5 animate-shimmer" />
        </div>

        {/* Vem passar programmet för? Section */}
        <div className="mt-12 animate-fadeIn">
          {/* Section Title */}
          <div className="mb-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 animate-shimmer" />
            <h2 className="font-['Orbitron',sans-serif] text-3xl font-black tracking-[4px] leading-[1.2] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Är du redo för<br />90 dagar som<br />förändrar allt?
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 animate-shimmer" />
          </div>

          {/* Two-column grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Left column - Passar för dig */}
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.3)] rounded-xl p-6 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#22c55e] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar för dig
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill gå ner 5-15 kg på 90 dagar med beprövade metoder</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är redo att följa en strukturerad plan och lyssna på coaching</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha personlig coaching och stöd genom hela resan</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är villig att investera i din hälsa och transformation</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill lära dig hållbara vanor för livet, inte bara en quick fix</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som är motiverad att checka in varje vecka och följa upp din progress</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#22c55e] text-xl flex-shrink-0">✓</span>
                  <span>Du som vill ha tillgång till träningsprogram, recept och kostplaner</span>
                </li>
              </ul>
            </div>

            {/* Right column - Passar INTE */}
            <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(239,68,68,0.3)] rounded-xl p-6 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(239,68,68,0.6)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:-translate-y-1">
              <h3 className="text-xl font-bold text-[#ef4444] mb-4 tracking-[2px] uppercase font-['Orbitron',sans-serif]">
                Passar INTE
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som letar efter en &ldquo;magisk piller&rdquo; utan att lägga in arbetet</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är redo att göra förändringar i din livsstil</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte kan följa en plan och vill &ldquo;göra på ditt sätt&rdquo;</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som inte är villig att investera tid och pengar i din hälsa</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som söker extrema crash-dieter eller ohållbara metoder</span>
                </li>
                <li className="flex items-start gap-3 text-[rgba(255,255,255,0.8)] text-sm">
                  <span className="text-[#ef4444] text-xl flex-shrink-0">✗</span>
                  <span>Du som har allvarliga medicinska tillstånd utan läkarkonsultation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-[rgba(255,255,255,0.8)] text-lg md:text-xl tracking-[2px] uppercase font-['Orbitron',sans-serif] font-semibold">
                Ansökningarna stänger om:
              </p>
            </div>
            <CountdownTimer />
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/apply')}
            className="w-full py-5 px-10 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] border-none rounded-lg cursor-pointer transition-all duration-300 font-['Orbitron',sans-serif] relative overflow-hidden hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,215,0,0.4)] active:scale-[0.98] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]"
          >
            Ansök Nu
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-[30px] border-t border-[rgba(255,215,0,0.2)]">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent my-[15px] opacity-30" />
          <p className="text-xs text-[rgba(255,215,0,0.6)] tracking-[1px]">
            Begränsat antal platser
          </p>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }

        .particle {
          animation: float 15s infinite ease-in-out;
        }

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

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-twinkle {
          animation: twinkle 2s infinite ease-in-out;
        }

        @keyframes shimmer {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        @keyframes titleGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
          }
        }

        .animate-titleGlow {
          animation: titleGlow 2s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 36px;
            letter-spacing: 4px;
          }
        }
      `}</style>
    </div>
  )
}
