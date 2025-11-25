'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const THRESHOLD = 80
  const MAX_PULL = 120

  // Haptic feedback when threshold is reached
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start if at the top of the page
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
      setHasReachedThreshold(false)
    }
  }, [isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only allow pulling down, not up
    if (diff > 0 && window.scrollY === 0) {
      // Apply resistance to make it feel more natural
      const resistance = 0.5
      const distance = Math.min(diff * resistance, MAX_PULL)
      setPullDistance(distance)

      // Trigger haptic when crossing threshold
      if (distance >= THRESHOLD && !hasReachedThreshold) {
        setHasReachedThreshold(true)
        triggerHaptic()
      } else if (distance < THRESHOLD && hasReachedThreshold) {
        setHasReachedThreshold(false)
      }

      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }, [isPulling, isRefreshing, hasReachedThreshold, triggerHaptic])

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(THRESHOLD)

      // Do a hard refresh to bypass cache
      setTimeout(() => {
        window.location.reload()
      }, 400)
    } else {
      setPullDistance(0)
    }

    setIsPulling(false)
    setHasReachedThreshold(false)
  }, [pullDistance, isRefreshing, isPulling])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const rotation = progress * 360

  // Determine status text
  const getStatusText = () => {
    if (isRefreshing) return 'Uppdaterar...'
    if (pullDistance >= THRESHOLD) return 'Släpp för att uppdatera'
    if (pullDistance > 20) return 'Dra för att uppdatera'
    return ''
  }

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Pull indicator */}
      <div
        className="fixed left-0 right-0 flex flex-col justify-center items-center z-[100] pointer-events-none"
        style={{
          top: 0,
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: pullDistance > 10 ? 1 : 0,
          transition: isPulling ? 'opacity 0.1s' : 'all 0.2s ease-out',
        }}
      >
        {/* Icon container */}
        <div
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            ${pullDistance >= THRESHOLD
              ? 'bg-gradient-to-br from-gold-primary to-gold-secondary shadow-lg shadow-gold-primary/30'
              : 'bg-gray-200'
            }
            transition-colors duration-200
            ${isRefreshing ? 'animate-spin' : ''}
          `}
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          {pullDistance >= THRESHOLD ? (
            <RefreshCw className="w-5 h-5 text-white" />
          ) : (
            <ArrowDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Status text */}
        {pullDistance > 20 && (
          <span
            className={`
              mt-2 text-xs font-medium transition-colors duration-200
              ${pullDistance >= THRESHOLD ? 'text-gold-primary' : 'text-gray-500'}
            `}
          >
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Content with transform when pulling */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
