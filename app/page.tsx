'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8)
    }
    setCode(value)
  }

  const handleSubmit = async () => {
    setError('')
    setIsValidating(true)

    try {
      const cleanCode = code.replace('-', '')
      const response = await fetch('/api/verify-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push(`/setup-account?token=${data.invitationToken}`)
        }, 2000)
      } else {
        setError(data.error || 'Ogiltig kod. Vänligen kontrollera och försök igen.')
      }
    } catch (err) {
      setError('Något gick fel. Vänligen försök igen.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.length >= 8) {
      handleSubmit()
    }
  }

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

      {/* Coach portal link */}
      <Link
        href="/login"
        className="absolute top-[30px] right-[30px] text-sm text-[rgba(255,215,0,0.7)] hover:text-[#FFD700] transition-all duration-300 tracking-wide font-light hover:-translate-x-1 z-20"
      >
        Coach Portal →
      </Link>

      {/* Main container */}
      <div className="relative z-10 text-center px-10 py-10 max-w-[600px] animate-fadeIn">
        {/* Symbol */}
        <div className="w-[120px] h-[120px] mx-auto mb-10 animate-symbolPulse">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M50 10 L90 85 L10 85 Z"
              fill="url(#goldGradient)"
              filter="url(#glow)"
              stroke="#FFD700"
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="4" fill="#FFD700" />
            <path d="M50 50 L50 75" stroke="#FFD700" strokeWidth="2" />
          </svg>
        </div>

        {/* Title */}
        <div className="mb-[30px]">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-5 animate-shimmer" />
          <h1 className="font-['Orbitron',sans-serif] text-5xl font-black tracking-[6px] leading-[1.2] uppercase animate-titleGlow bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            90-DAGARS
            <br />
            CHALLENGE
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-5 animate-shimmer" />
        </div>

        {/* Apply button */}
        <button className="w-full py-5 px-10 text-base tracking-[2px] uppercase font-semibold bg-[rgba(255,255,255,0.05)] text-[rgba(255,215,0,0.9)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg cursor-pointer transition-all duration-300 backdrop-blur-[10px] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.6)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,215,0,0.2)] active:translate-y-0">
          Ansök Nu
        </button>

        {/* OR divider */}
        <div className="flex items-center gap-5 my-10">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />
          <span className="text-sm tracking-[2px] text-[rgba(255,255,255,0.4)] uppercase font-light">
            eller
          </span>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.3)] to-transparent" />
        </div>

        {/* Input section */}
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-10 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">
          <div className="flex items-center justify-center gap-2.5 text-sm tracking-[2px] text-[rgba(255,215,0,0.8)] mb-5 uppercase font-semibold">
            <span className="text-lg">🔑</span>
            <span>Din Kod</span>
          </div>

          <input
            type="text"
            className={`w-full py-5 px-5 text-2xl tracking-[8px] text-center bg-[rgba(0,0,0,0.3)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg text-[#FFD700] font-['Orbitron',sans-serif] font-bold transition-all duration-300 uppercase placeholder:text-[rgba(255,215,0,0.3)] placeholder:tracking-[4px] focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] focus:bg-[rgba(0,0,0,0.5)] ${
              error ? 'animate-shake border-[#ff4444]' : ''
            }`}
            placeholder="XXXX-XXXX"
            maxLength={9}
            value={code}
            onChange={handleCodeInput}
            onKeyPress={handleKeyPress}
            disabled={isValidating}
          />

          <button
            onClick={handleSubmit}
            disabled={isValidating || code.length < 8}
            className="w-full mt-5 py-5 px-10 text-lg tracking-[3px] uppercase font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] border-none rounded-lg cursor-pointer transition-all duration-300 font-['Orbitron',sans-serif] relative overflow-hidden hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,215,0,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]"
          >
            {isValidating ? 'Validerar...' : 'Lås Upp Tillgång'}
          </button>

          {showSuccess && (
            <div className="mt-5 bg-[rgba(0,217,255,0.1)] border-2 border-[rgba(0,217,255,0.3)] py-5 px-5 rounded-lg animate-fadeIn">
              ✓ Välkommen. Din transformation börjar nu.
            </div>
          )}

          {error && (
            <div className="mt-5 text-[#ff4444] text-sm">
              {error}
            </div>
          )}
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

        @keyframes symbolPulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 40px rgba(255, 215, 0, 0.8));
          }
        }

        .animate-symbolPulse {
          animation: symbolPulse 3s infinite ease-in-out;
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

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-shake {
          animation: shake 0.5s;
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
