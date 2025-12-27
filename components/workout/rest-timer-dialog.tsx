'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Minimize2, Maximize2 } from 'lucide-react'

interface RestTimerDialogProps {
  isOpen: boolean
  totalSeconds: number
  remainingSeconds: number
  onStop: () => void
  onAddTime: (seconds: number) => void
  onMinimize?: () => void
}

interface MinimizedRestBarProps {
  totalSeconds: number
  remainingSeconds: number
  onStop: () => void
  onAddTime: (seconds: number) => void
  onExpand: () => void
}

export function RestTimerDialog({
  isOpen,
  totalSeconds,
  remainingSeconds,
  onStop,
  onAddTime,
  onMinimize
}: RestTimerDialogProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [hideInfo, setHideInfo] = useState(false)

  // Ladda "visa inte igen" från localStorage
  useEffect(() => {
    const stored = localStorage.getItem('restTimerHideInfo')
    if (stored === 'true') {
      setHideInfo(true)
    }
  }, [])

  const handleHideInfoChange = (checked: boolean) => {
    setHideInfo(checked)
    localStorage.setItem('restTimerHideInfo', checked ? 'true' : 'false')
  }

  // Spela ljud när tiden är slut
  useEffect(() => {
    if (isOpen && remainingSeconds <= 0) {
      playBeep()
      const timeout = setTimeout(onStop, 500)
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
    : seconds.toString()

  // Färg baserat på progress
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const color = progress > 0.5 ? '#22c55e' : progress > 0.25 ? '#f59e0b' : '#ef4444'

  // Skapa portalen för att rendera överst i DOM
  const dialogContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Top buttons */}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          zIndex: 100000,
        }}
      >
        {/* Minimize button */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            style={{
              color: '#64748b',
              background: '#fff',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Minimize2 style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Minimera</span>
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onStop}
          style={{
            color: '#64748b',
            background: '#fff',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            marginLeft: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <X style={{ width: 24, height: 24 }} />
        </button>
      </div>

      {/* Titel */}
      <h2 style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '1.5rem', fontWeight: 500 }}>Vila</h2>

      {/* Timer cirkel */}
      <div style={{ position: 'relative', width: 240, height: 240, marginBottom: '2rem' }}>
        <svg width={240} height={240} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={120} cy={120} r={110} fill="none" stroke="#e2e8f0" strokeWidth={8} />
          <circle
            cx={120}
            cy={120}
            r={110}
            fill="none"
            stroke={progress > 0.5 ? '#10b981' : progress > 0.25 ? '#f59e0b' : '#ef4444'}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={2 * Math.PI * 110 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '3.5rem',
              fontWeight: 600,
              color: '#0f172a',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Knappar */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => onAddTime(30)}
          style={{
            width: 72,
            height: 72,
            borderRadius: '1rem',
            border: '2px solid #e2e8f0',
            background: '#fff',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Plus style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: '0.75rem', marginTop: 2, fontWeight: 500 }}>+30s</span>
        </button>

        <button
          onClick={onStop}
          style={{
            width: 72,
            height: 72,
            borderRadius: '1rem',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          Stoppa
        </button>
      </div>

      {/* Vila info */}
      {!hideInfo && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '0.5rem',
            maxWidth: '320px',
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 600 }}>
            Hur du vilar mellan set
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>
            Efter varje set, vila tills du:
          </p>
          <ul style={{ fontSize: '0.75rem', color: '#888', paddingLeft: '0', margin: 0, lineHeight: 1.6, listStyle: 'none' }}>
            <li style={{ marginBottom: '0.35rem', paddingLeft: '1rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>•</span>
              Inte längre andas tungt
            </li>
            <li style={{ marginBottom: '0.35rem', paddingLeft: '1rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>•</span>
              Känner dig mentalt redo för nästa set
            </li>
            <li style={{ paddingLeft: '1rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>•</span>
              Inte har kramp i stödmuskulaturen (t.ex. trött i ländryggen innan nästa knäböj)
            </li>
          </ul>
          <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.75rem', fontStyle: 'italic' }}>
            Det är helt OK att lägga till 30 sekunder om du behöver mer vila!
          </p>
        </div>
      )}

      {/* Visa inte igen checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: '#666',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={hideInfo}
          onChange={(e) => handleHideInfoChange(e.target.checked)}
          style={{
            width: '1rem',
            height: '1rem',
            cursor: 'pointer',
          }}
        />
        Visa inte tips igen
      </label>
    </div>
  )

  // Använd portal för att garantera att den renderas överst
  if (typeof window !== 'undefined') {
    return createPortal(dialogContent, document.body)
  }

  return dialogContent
}

// Minimized rest timer bar component
export function MinimizedRestBar({
  totalSeconds,
  remainingSeconds,
  onStop,
  onAddTime,
  onExpand
}: MinimizedRestBarProps) {
  // Format time as HH:MM:SS
  const formatTime = (secs: number) => {
    const abs = Math.abs(secs)
    const hrs = Math.floor(abs / 3600)
    const mins = Math.floor((abs % 3600) / 60)
    const s = abs % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Calculate overtime (negative time)
  const isOvertime = remainingSeconds < 0
  const overtimeSeconds = isOvertime ? Math.abs(remainingSeconds) : 0

  const barContent = (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '0.875rem 1.5rem',
        paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '64rem',
          margin: '0 auto',
        }}
      >
        {/* Timer display */}
        <div style={{ flex: 1 }}>
          {/* Overtime indicator */}
          {isOvertime && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f43f5e',
                fontWeight: 500,
                display: 'block',
                marginBottom: '-0.125rem',
              }}
            >
              -{formatTime(overtimeSeconds)}
            </span>
          )}
          {/* Main timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '1.875rem',
                fontWeight: 600,
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.025em',
              }}
            >
              {formatTime(Math.max(0, remainingSeconds))}
            </span>
            {/* Reset button */}
            <button
              onClick={() => onAddTime(totalSeconds - remainingSeconds)}
              style={{
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Återställ timer"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Pause/Stop button */}
        <button
          onClick={onStop}
          style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '0.625rem',
            border: '2px solid #cbd5e1',
            background: '#fff',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(barContent, document.body)
  }

  return barContent
}
