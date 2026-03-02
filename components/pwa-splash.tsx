'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function PWASplash() {
  const [isVisible, setIsVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Kolla om vi kör i PWA standalone-läge
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true

    if (!isStandalone) return

    setIsVisible(true)

    // Visa splash i 1.5 sekunder, sedan fade out
    const timer = setTimeout(() => {
      setIsFading(true)
      setTimeout(() => setIsVisible(false), 500)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(180deg, #1a3a4a 0%, #0f1f26 50%, #0a1014 100%)'
      }}
    >
      {/* Logo med scale-in animation */}
      <div className={`transition-transform duration-700 ease-out ${isFading ? 'scale-95' : 'scale-100'}`}>
        <Image
          src="/images/icon-192.png"
          alt="Friskvårdskompassen"
          width={100}
          height={100}
          className="drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  )
}
