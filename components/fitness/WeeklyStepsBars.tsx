'use client'

import { useEffect, useState } from 'react'
import { Footprints, TrendingUp, Target, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepDay {
  date: string
  dayName: string
  steps: number | null
  goal: number | null
  percentage: number | null
}

interface StepsSummary {
  avgSteps: number
  goalsMet: number
  totalDays: number
  bestDay: {
    dayName: string
    steps: number
  } | null
  defaultGoal: number
}

interface WeeklyStepsBarsProps {
  className?: string
  showSummary?: boolean
  compact?: boolean
}

export function WeeklyStepsBars({
  className,
  showSummary = true,
  compact = false,
}: WeeklyStepsBarsProps) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [days, setDays] = useState<StepDay[]>([])
  const [summary, setSummary] = useState<StepsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeeklyData()
  }, [])

  const fetchWeeklyData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/fitbit/steps/weekly')
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data')
      }

      const data = await response.json()
      setConnected(data.connected)
      setDays(data.days || [])
      setSummary(data.summary || null)
    } catch (err) {
      console.error('Error fetching weekly steps data:', err)
      setError('Kunde inte hämta stegdata')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="flex items-end gap-2 h-32">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-200 rounded-t"
                style={{ height: `${40 + Math.random() * 60}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <p className="text-gray-500 text-center">{error}</p>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="text-center">
          <Footprints className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Koppla din Fitbit i profilen for att se stegdata</p>
        </div>
      </div>
    )
  }

  // Find max value for scaling (minimum 10000 steps)
  const maxSteps = Math.max(
    ...days.map((d) => d.steps || 0),
    summary?.defaultGoal || 10000
  )

  const goalLine = summary?.defaultGoal || 10000

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-800">Steguppfoljning</h3>
            <p className="text-sm text-gray-500">Veckooversikt</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="relative">
          {/* Goal line */}
          {goalLine > 0 && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300 z-10"
              style={{ bottom: `calc(${(goalLine / maxSteps) * 100}% + 32px)` }}
            >
              <span className="absolute right-0 -top-5 text-xs text-blue-400">
                Mal: {goalLine.toLocaleString('sv-SE')}
              </span>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end justify-between gap-1 sm:gap-2">
            {days.map((day) => {
              const maxBarHeight = compact ? 80 : 120
              const barHeight =
                day.steps !== null
                  ? Math.max(4, (day.steps / maxSteps) * maxBarHeight)
                  : 4

              // Color based on goal achievement
              const getBarColor = () => {
                if (day.steps === null) return 'bg-gray-200'
                if (day.percentage !== null) {
                  if (day.percentage >= 100) return 'bg-green-400'
                  if (day.percentage >= 80) return 'bg-yellow-400'
                  return 'bg-red-400'
                }
                return 'bg-blue-300'
              }

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="relative w-full flex items-end justify-center"
                    style={{ height: `${maxBarHeight}px` }}
                  >
                    <div
                      className={cn(
                        'w-full max-w-[40px] rounded-t transition-all duration-300',
                        getBarColor()
                      )}
                      style={{ height: `${barHeight}px` }}
                    >
                      {/* Goal met indicator */}
                      {day.percentage !== null && day.percentage >= 100 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day label */}
                  <div className="mt-2 text-center">
                    <span className="text-xs font-medium text-gray-600">{day.dayName}</span>
                    {day.steps !== null && !compact && (
                      <p className="text-[10px] text-gray-400">
                        {day.steps.toLocaleString('sv-SE')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span>100%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span>80-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span>&lt;80%</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {showSummary && summary && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-lg font-bold text-gray-800">
                {summary.avgSteps.toLocaleString('sv-SE')}
              </p>
            </div>
            <p className="text-xs text-gray-500">Snitt steg/dag</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Target className="h-4 w-4 text-green-500" />
              <p className="text-lg font-bold text-gray-800">
                {summary.goalsMet}/{summary.totalDays}
              </p>
            </div>
            <p className="text-xs text-gray-500">Mal uppnadda</p>
          </div>
          <div className="text-center">
            {summary.bestDay && (
              <>
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <p className="text-lg font-bold text-gray-800">
                    {summary.bestDay.steps.toLocaleString('sv-SE')}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Bast ({summary.bestDay.dayName})</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
