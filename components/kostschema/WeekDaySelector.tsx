'use client'

import { Dumbbell, Moon, Copy, Layers } from 'lucide-react'
import { DayOfWeek, DayConfig, DAYS_OF_WEEK, WeekMacroMode } from '@/lib/kostschema/types'
import { calculateWeeklyCalories } from '@/lib/kostschema/macro-distribution'

interface WeekDaySelectorProps {
  selectedDay: DayOfWeek
  onSelectDay: (day: DayOfWeek) => void
  weekConfig: Record<DayOfWeek, DayConfig>
  onToggleTraining: (day: DayOfWeek) => void
  weekMacroMode: WeekMacroMode
  onWeekMacroModeChange: (mode: WeekMacroMode) => void
}

export function WeekDaySelector({
  selectedDay,
  onSelectDay,
  weekConfig,
  onToggleTraining,
  weekMacroMode,
  onWeekMacroModeChange
}: WeekDaySelectorProps) {
  const weeklyCalories = calculateWeeklyCalories(weekConfig)
  const trainingDays = Object.values(weekConfig).filter(d => d.isTrainingDay).length

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-zinc-300 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Veckokonfiguration</h3>
          <p className="text-sm text-zinc-600">
            {weekMacroMode === 'same'
              ? 'Samma kalorier och makros alla dagar'
              : 'Klicka på en dag för att redigera, dubbelklicka för att växla träning/vila'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Week macro mode toggle */}
          <div className="flex gap-1 bg-zinc-200 rounded-lg p-1">
            <button
              onClick={() => onWeekMacroModeChange('same')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                weekMacroMode === 'same'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <Copy className="w-3 h-3" />
              Samma
            </button>
            <button
              onClick={() => onWeekMacroModeChange('different')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                weekMacroMode === 'different'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <Layers className="w-3 h-3" />
              Olika per dag
            </button>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500">Veckobudget</div>
            <div className="text-xl font-bold text-amber-600">{weeklyCalories.toLocaleString()} kcal</div>
            <div className="text-xs text-zinc-400">{trainingDays} träningsdagar</div>
          </div>
        </div>
      </div>

      {/* Day buttons */}
      <div className="flex gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const config = weekConfig[day.key]
          const isSelected = selectedDay === day.key
          const isTraining = config.isTrainingDay

          return (
            <button
              key={day.key}
              onClick={() => onSelectDay(day.key)}
              onDoubleClick={() => onToggleTraining(day.key)}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 border-2 border-amber-600'
                  : isTraining
                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-zinc-100 text-zinc-700 border-2 border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              <span className="text-sm font-medium">{day.shortLabel}</span>
              <div className="mt-1">
                {isTraining ? (
                  <Dumbbell className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs mt-1 opacity-75">
                {config.totalCalories} kcal
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-600 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border-2 border-emerald-300" />
          <Dumbbell className="w-3 h-3 text-emerald-600" />
          <span>Träningsdag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-zinc-100 border-2 border-zinc-300" />
          <Moon className="w-3 h-3 text-zinc-500" />
          <span>Vilodag</span>
        </div>
      </div>
    </div>
  )
}
