'use client'

import { useEffect, useState } from 'react'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = (): TimeLeft => {
      // Target date: 2025-12-22 00:00:00 Sweden time (UTC+1)
      const targetDate = new Date('2025-12-22T00:00:00+01:00')
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const timeUnits = [
    { label: 'DAGAR', value: timeLeft.days },
    { label: 'TIMMAR', value: timeLeft.hours },
    { label: 'MINUTER', value: timeLeft.minutes },
    { label: 'SEKUNDER', value: timeLeft.seconds }
  ]

  return (
    <div className="w-full animate-fadeIn">
      {/* Urgency message */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[rgba(239,68,68,0.1)] to-[rgba(239,68,68,0.05)] border-2 border-[rgba(239,68,68,0.4)] rounded-full backdrop-blur-sm animate-pulse">
          <span className="text-2xl">⏰</span>
          <span className="text-sm tracking-[2px] uppercase font-bold text-[#ef4444] font-['Orbitron',sans-serif]">
            Ansökningar stänger snart
          </span>
        </div>
      </div>

      {/* Countdown grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
        {timeUnits.map((unit, index) => (
          <div
            key={unit.label}
            className="relative group"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Glass card */}
            <div className="relative bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.3)] rounded-2xl p-4 md:p-6 backdrop-blur-[10px] transition-all duration-300 group-hover:border-[rgba(255,215,0,0.6)] group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] group-hover:-translate-y-1 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {/* Value */}
              <div className="relative text-center">
                <div className="font-['Orbitron',sans-serif] text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-2 tabular-nums">
                  {String(unit.value).padStart(2, '0')}
                </div>

                {/* Label */}
                <div className="text-[10px] md:text-xs tracking-[2px] uppercase text-[rgba(255,215,0,0.7)] font-semibold">
                  {unit.label}
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#FFD700] rounded-full animate-ping" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#FFD700] rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom message */}
      <div className="text-center mt-6">
        <p className="text-xs md:text-sm text-[rgba(255,215,0,0.6)] tracking-[1px]">
          Efter detta datum kommer inga fler ansökningar accepteras
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}
