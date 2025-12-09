'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Coffee } from 'lucide-react'

interface DailyTarget {
  dayOfWeek: number
  dayName: string
  calories: string
  protein: string
  fat: string
  carbs: string
  isTrainingDay?: boolean
}

interface WeeklyConfigPanelProps {
  useDifferentDailyTargets: boolean
  onToggleMode: (useDifferent: boolean) => void
  dailyTargets: DailyTarget[]
  onTargetsChange: (targets: DailyTarget[]) => void
  defaultCalories?: string
  defaultProtein?: string
  defaultFat?: string
  defaultCarbs?: string
}

const WEEKDAYS = [
  { short: 'Mån', full: 'Måndag' },
  { short: 'Tis', full: 'Tisdag' },
  { short: 'Ons', full: 'Onsdag' },
  { short: 'Tor', full: 'Torsdag' },
  { short: 'Fre', full: 'Fredag' },
  { short: 'Lör', full: 'Lördag' },
  { short: 'Sön', full: 'Söndag' },
]

export function WeeklyConfigPanel({
  useDifferentDailyTargets,
  onToggleMode,
  dailyTargets,
  onTargetsChange,
  defaultCalories = '',
  defaultProtein = '',
  defaultFat = '',
  defaultCarbs = '',
}: WeeklyConfigPanelProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Calculate weekly total
  const weeklyTotal = dailyTargets.reduce((sum, day) => {
    return sum + (parseInt(day.calories) || 0)
  }, 0)

  // Count training days
  const trainingDays = dailyTargets.filter(d => d.isTrainingDay).length

  const handleDayClick = (dayIndex: number) => {
    if (useDifferentDailyTargets) {
      setSelectedDay(selectedDay === dayIndex ? null : dayIndex)
    }
  }

  const handleToggleTrainingDay = (dayIndex: number) => {
    const newTargets = [...dailyTargets]
    newTargets[dayIndex] = {
      ...newTargets[dayIndex],
      isTrainingDay: !newTargets[dayIndex].isTrainingDay
    }
    onTargetsChange(newTargets)
  }

  const handleTargetChange = (dayIndex: number, field: keyof DailyTarget, value: string) => {
    const newTargets = [...dailyTargets]
    newTargets[dayIndex] = {
      ...newTargets[dayIndex],
      [field]: value
    }
    onTargetsChange(newTargets)
  }

  const copyToAllDays = () => {
    if (selectedDay === null) return
    const source = dailyTargets[selectedDay]
    const newTargets = dailyTargets.map(day => ({
      ...day,
      calories: source.calories,
      protein: source.protein,
      fat: source.fat,
      carbs: source.carbs,
    }))
    onTargetsChange(newTargets)
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Veckokonfiguration</h3>
          <p className="text-sm text-zinc-500">Samma kalorier och makros alla dagar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            <Button
              type="button"
              size="sm"
              onClick={() => onToggleMode(false)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                !useDifferentDailyTargets
                  ? 'bg-green-600 text-white'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <span className="mr-1">⟳</span> Samma
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onToggleMode(true)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                useDifferentDailyTargets
                  ? 'bg-amber-600 text-white'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Olika per dag
            </Button>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Veckobudget</p>
            <p className="text-xl font-bold text-white">{weeklyTotal.toLocaleString()} kcal</p>
            <p className="text-xs text-zinc-500">{trainingDays} träningsdagar</p>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day, index) => {
          const target = dailyTargets[index]
          const isSelected = selectedDay === index
          const isTraining = target?.isTrainingDay
          const calories = parseInt(target?.calories) || 0

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(index)}
              disabled={!useDifferentDailyTargets}
              className={`
                relative flex flex-col items-center p-3 rounded-xl border transition-all
                ${isSelected
                  ? 'bg-amber-500 border-amber-400 text-black'
                  : isTraining
                    ? 'bg-green-900/50 border-green-700/50 text-white'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
                }
                ${useDifferentDailyTargets ? 'hover:border-amber-500/50 cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Day label */}
              <span className={`text-xs font-medium ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                {day.short}
              </span>

              {/* Training/Rest icon */}
              <div className="my-1">
                {isTraining ? (
                  <Dumbbell className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-green-400'}`} />
                ) : (
                  <Coffee className={`w-4 h-4 ${isSelected ? 'text-black/70' : 'text-zinc-500'}`} />
                )}
              </div>

              {/* Calories */}
              <span className={`text-sm font-semibold ${isSelected ? 'text-black' : ''}`}>
                {calories > 0 ? `${calories} kcal` : '-'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-3 h-3 text-green-400" />
          <span>Träningsdag</span>
        </div>
        <div className="flex items-center gap-2">
          <Coffee className="w-3 h-3 text-zinc-500" />
          <span>Vilodag</span>
        </div>
      </div>

      {/* Selected Day Editor */}
      {useDifferentDailyTargets && selectedDay !== null && (
        <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-white font-semibold">
                Makros för {WEEKDAYS[selectedDay].full}
              </h4>
              <button
                type="button"
                onClick={() => handleToggleTrainingDay(selectedDay)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  dailyTargets[selectedDay]?.isTrainingDay
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                <Dumbbell className="w-3 h-3 inline mr-1" />
                Träningsdag
              </button>
            </div>
            <button
              type="button"
              onClick={copyToAllDays}
              className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
            >
              Kopiera till alla dagar
            </button>
          </div>

          {/* Macro Inputs */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Kalorier</Label>
              <Input
                type="number"
                value={dailyTargets[selectedDay]?.calories || ''}
                onChange={(e) => handleTargetChange(selectedDay, 'calories', e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white h-10"
                placeholder="3200"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Protein (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={dailyTargets[selectedDay]?.protein || ''}
                onChange={(e) => handleTargetChange(selectedDay, 'protein', e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white h-10"
                placeholder="180"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Kolhydrater (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={dailyTargets[selectedDay]?.carbs || ''}
                onChange={(e) => handleTargetChange(selectedDay, 'carbs', e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white h-10"
                placeholder="315"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Fett (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={dailyTargets[selectedDay]?.fat || ''}
                onChange={(e) => handleTargetChange(selectedDay, 'fat', e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white h-10"
                placeholder="62"
              />
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-zinc-500">Dagens makros:</span>
            <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-white">
              {dailyTargets[selectedDay]?.calories || 0} kcal
            </span>
            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">
              P: {dailyTargets[selectedDay]?.protein || 0}g
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
              K: {dailyTargets[selectedDay]?.carbs || 0}g
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
              F: {dailyTargets[selectedDay]?.fat || 0}g
            </span>
          </div>
        </div>
      )}

      {/* Same for all days mode */}
      {!useDifferentDailyTargets && (
        <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
          <p className="text-sm text-zinc-400 mb-4">
            Alla dagar använder samma makromål. Ställ in globala mål i &quot;Plandetaljer&quot; ovan.
          </p>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Kalorier</p>
              <p className="text-lg font-bold text-white">{defaultCalories || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Protein</p>
              <p className="text-lg font-bold text-pink-400">{defaultProtein || '-'}g</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Kolhydrater</p>
              <p className="text-lg font-bold text-blue-400">{defaultCarbs || '-'}g</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Fett</p>
              <p className="text-lg font-bold text-amber-400">{defaultFat || '-'}g</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
