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
    <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 rounded-2xl p-5 border border-zinc-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Veckokonfiguration</h3>
          <p className="text-sm text-zinc-400">
            {weekMacroMode === 'same'
              ? 'Samma kalorier och makros alla dagar'
              : 'Klicka på en dag för att redigera, dubbelklicka för att växla träning/vila'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Week macro mode toggle */}
          <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1">
            <button
              onClick={() => onWeekMacroModeChange('same')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                weekMacroMode === 'same'
                  ? 'bg-gold-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Copy className="w-3 h-3" />
              Samma
            </button>
            <button
              onClick={() => onWeekMacroModeChange('different')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                weekMacroMode === 'different'
                  ? 'bg-gold-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Olika per dag
            </button>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">Veckobudget</div>
            <div className="text-xl font-bold text-gold-500">{weeklyCalories.toLocaleString()} kcal</div>
            <div className="text-xs text-zinc-500">{trainingDays} träningsdagar</div>
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
                  ? 'bg-gold-600 text-white shadow-lg shadow-gold-600/25'
                  : isTraining
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
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
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
          <Dumbbell className="w-3 h-3 text-emerald-400" />
          <span>Träningsdag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" />
          <Moon className="w-3 h-3 text-zinc-400" />
          <span>Vilodag</span>
        </div>
      </div>
    </div>
  )
}
