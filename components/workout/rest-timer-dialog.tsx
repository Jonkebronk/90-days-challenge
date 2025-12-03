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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      {/* Stäng-knapp */}
      <button
        onClick={onStop}
        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Titel */}
      <h2 className="text-xl text-gray-400 mb-8 font-medium">Vila</h2>

      {/* Cirkulär timer */}
      <div className="relative mb-8">
        {/* SVG Progress Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Bakgrundscirkel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
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
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer text i mitten */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono font-light tracking-tight"
            style={{
              fontSize: minutes > 0 ? '5rem' : '7rem',
              color: 'white'
            }}
          >
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Knappar */}
      <div className="flex gap-4">
        {/* +30s knapp */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => onAddTime(30)}
          className="rounded-full w-20 h-20 border-2 border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
        >
          <div className="flex flex-col items-center">
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1">30s</span>
          </div>
        </Button>

        {/* Stoppa knapp */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onStop}
          className="rounded-full w-20 h-20 bg-red-600/80 hover:bg-red-600 text-white font-medium"
        >
          Stoppa
        </Button>
      </div>

      {/* Visar total vilatid */}
      <p className="text-gray-500 mt-8 text-sm">
        Föreskriven vila: {totalSeconds}s
      </p>
    </div>
  )
}
