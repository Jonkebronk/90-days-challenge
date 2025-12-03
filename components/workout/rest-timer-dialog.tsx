'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'

interface RestTimerDialogProps {
  isOpen: boolean
  totalSeconds: number      // Total vilatid
  remainingSeconds: number  // Kvarvarande tid
  onStop: () => void        // Stäng/stoppa dialog
  onAddTime: (seconds: number) => void
}

export function RestTimerDialog({
  isOpen,
  totalSeconds,
  remainingSeconds,
  onStop,
  onAddTime
}: RestTimerDialogProps) {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Lås scroll när dialogen är öppen
  useEffect(() => {
    if (isOpen) {
      // Spara nuvarande scroll position och lås body
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'

      return () => {
        // Återställ scroll position när dialogen stängs
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Spela ljud när tiden är slut
  useEffect(() => {
    if (isOpen && remainingSeconds <= 0) {
      playBeep()
      // Stäng automatiskt efter en kort fördröjning
      const timeout = setTimeout(() => {
        onStop()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isOpen, remainingSeconds, onStop])

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (e) {
      console.log('Could not play beep')
    }
  }

  if (!isOpen) return null

  // Formatera tid
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeDisplay = minutes > 0
    ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : seconds.toString().padStart(2, '0')

  // Beräkna progress (1 = full, 0 = tom)
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0

  // Färg baserat på progress
  const getColor = () => {
    if (progress > 0.5) return '#22c55e' // Grön
    if (progress > 0.25) return '#f59e0b' // Gul/Orange
    return '#ef4444' // Röd
  }

  // SVG cirkel parametrar
  const size = 280
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
        minHeight: '100vh',
      }}
    >
      {/* Stäng-knapp */}
      <button
        onClick={onStop}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[10000]"
        style={{ position: 'absolute' }}
      >
        <X className="h-10 w-10" />
      </button>

      {/* Titel */}
      <h2 className="text-2xl text-white mb-8 font-medium">Vila</h2>

      {/* Cirkulär timer */}
      <div className="relative mb-8" style={{ width: size, height: size }}>
        {/* SVG Progress Circle */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Bakgrundscirkel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
          />
          {/* Progress cirkel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Timer text i mitten */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <span
            className="font-mono font-light tracking-tight text-white"
            style={{
              fontSize: minutes > 0 ? '4.5rem' : '6rem',
            }}
          >
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Knappar */}
      <div className="flex gap-6">
        {/* +30s knapp */}
        <button
          onClick={() => onAddTime(30)}
          className="rounded-full w-20 h-20 border-2 border-gray-500 bg-gray-800 text-white hover:bg-gray-700 flex flex-col items-center justify-center"
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs mt-1">+30s</span>
        </button>

        {/* Stoppa knapp */}
        <button
          onClick={onStop}
          className="rounded-full w-20 h-20 bg-red-600 hover:bg-red-500 text-white font-semibold"
        >
          Stoppa
        </button>
      </div>

      {/* Visar total vilatid */}
      <p className="text-gray-400 mt-10 text-base">
        Föreskriven vila: {totalSeconds}s
      </p>
    </div>
  )
}
