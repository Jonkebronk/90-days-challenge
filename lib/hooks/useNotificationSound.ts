'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Hook for playing notification sounds
 * Uses an audio file if available, falls back to Web Audio API beep
 */
export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Try to preload the notification sound file
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.preload = 'auto'
      audioRef.current = audio
    }
  }, [])

  /**
   * Play a beep using Web Audio API (fallback)
   */
  const playBeep = useCallback(() => {
    try {
      // Create AudioContext lazily (must be after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current

      // Create oscillator for the beep
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Pleasant notification tone (like Facebook Messenger)
      oscillator.frequency.value = 880 // A5 note
      oscillator.type = 'sine'

      // Quick fade in and out
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    } catch (err) {
      console.warn('Could not play notification beep:', err)
    }
  }, [])

  /**
   * Play notification sound
   * Tries audio file first, falls back to Web Audio API beep
   */
  const playSound = useCallback(() => {
    if (typeof window === 'undefined') return

    // Try to play the audio file
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
        .catch(() => {
          // If audio file fails, fall back to beep
          playBeep()
        })
    } else {
      // No audio file loaded, use beep
      playBeep()
    }
  }, [playBeep])

  /**
   * Check if notifications are enabled/allowed
   */
  const isEnabled = useCallback(() => {
    if (typeof window === 'undefined') return false
    // Could add user preference check here
    return true
  }, [])

  return { playSound, playBeep, isEnabled }
}

export default useNotificationSound
