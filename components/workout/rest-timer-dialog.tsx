'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus } from 'lucide-react'

interface RestTimerDialogProps {
  isOpen: boolean
  totalSeconds: number
  remainingSeconds: number
  onStop: () => void
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
        backgroundColor: '#000',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Stäng-knapp */}
      <button
        onClick={onStop}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          color: '#fff',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100000,
        }}
      >
        <X style={{ width: 40, height: 40 }} />
      </button>

      {/* Titel */}
      <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '2rem' }}>Vila</h2>

      {/* Timer cirkel */}
      <div style={{ position: 'relative', width: 260, height: 260, marginBottom: '2rem' }}>
        <svg width={260} height={260} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={130} cy={130} r={120} fill="none" stroke="#333" strokeWidth={8} />
          <circle
            cx={130}
            cy={130}
            r={120}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
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
              fontFamily: 'monospace',
              fontSize: minutes > 0 ? '4rem' : '5rem',
              fontWeight: 300,
              color: '#fff',
            }}
          >
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Knappar */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button
          onClick={() => onAddTime(30)}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid #666',
            background: '#333',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: '0.75rem', marginTop: 4 }}>+30s</span>
        </button>

        <button
          onClick={onStop}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: 'none',
            background: '#dc2626',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
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
