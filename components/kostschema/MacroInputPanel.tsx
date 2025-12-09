'use client'

import { useState } from 'react'
import { Calculator, Edit3, Clock, Dumbbell, Moon } from 'lucide-react'
import { DayConfig, MacroSourceMode, ActivityLevel, DAYS_OF_WEEK, DayOfWeek } from '@/lib/kostschema/types'
import { calculateMacros } from '@/lib/kostschema/hooks/useMacroCalculation'

interface MacroInputPanelProps {
  dayConfig: DayConfig
  selectedDay: DayOfWeek
  macroSourceMode: MacroSourceMode
  onMacroSourceModeChange: (mode: MacroSourceMode) => void
  onDayConfigChange: (config: DayConfig) => void
  // For calculate mode
  bodyWeight: number
  onBodyWeightChange: (weight: number) => void
  activityLevel: ActivityLevel
  onActivityLevelChange: (level: ActivityLevel) => void
  proteinFactor: number
  onProteinFactorChange: (factor: number) => void
}

export function MacroInputPanel({
  dayConfig,
  selectedDay,
  macroSourceMode,
  onMacroSourceModeChange,
  onDayConfigChange,
  bodyWeight,
  onBodyWeightChange,
  activityLevel,
  onActivityLevelChange,
  proteinFactor,
  onProteinFactorChange
}: MacroInputPanelProps) {
  const dayLabel = DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label || selectedDay

  // Calculate macros from weight (for calculate mode)
  const calculatedMacros = calculateMacros({
    bodyWeight,
    activityLevel,
    weightLossTempo: 700, // Default
    proteinFactor
  })

  const handleMacroChange = (field: keyof DayConfig, value: number) => {
    onDayConfigChange({
      ...dayConfig,
      [field]: value
    })
  }

  const handleTrainingTimeChange = (time: string) => {
    onDayConfigChange({
      ...dayConfig,
      trainingTime: time
    })
  }

  const handleToggleTraining = () => {
    onDayConfigChange({
      ...dayConfig,
      isTrainingDay: !dayConfig.isTrainingDay,
      trainingTime: !dayConfig.isTrainingDay ? '15:00' : undefined
    })
  }

  // Apply calculated macros to day config
  const applyCalculatedMacros = () => {
    onDayConfigChange({
      ...dayConfig,
      totalCalories: Math.round(calculatedMacros.kcal),
      totalProtein: Math.round(calculatedMacros.protein),
      totalCarbs: Math.round(calculatedMacros.carbs),
      totalFat: Math.round(calculatedMacros.fat)
    })
  }

  return (
    <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 rounded-2xl p-5 border border-zinc-700/50 space-y-5">
      {/* Header with day info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">
            Makros för {dayLabel}
          </h3>
          <button
            onClick={handleToggleTraining}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              dayConfig.isTrainingDay
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-700 text-zinc-300 border border-zinc-600'
            }`}
          >
            {dayConfig.isTrainingDay ? (
              <>
                <Dumbbell className="w-4 h-4" />
                Träningsdag
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                Vilodag
              </>
            )}
          </button>
        </div>

        {/* Training time (only for training days) */}
        {dayConfig.isTrainingDay && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">Träningstid:</span>
            <input
              type="time"
              value={dayConfig.trainingTime || '15:00'}
              onChange={(e) => handleTrainingTimeChange(e.target.value)}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onMacroSourceModeChange('calculate')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            macroSourceMode === 'calculate'
              ? 'bg-gold-600 text-white'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Beräkna från vikt
        </button>
        <button
          onClick={() => onMacroSourceModeChange('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            macroSourceMode === 'manual'
              ? 'bg-gold-600 text-white'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Ange manuellt
        </button>
      </div>

      {/* Calculate mode inputs */}
      {macroSourceMode === 'calculate' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Kroppsvikt (kg)</label>
            <input
              type="number"
              value={bodyWeight}
              onChange={(e) => onBodyWeightChange(Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Aktivitetsnivå</label>
            <select
              value={activityLevel}
              onChange={(e) => onActivityLevelChange(e.target.value as ActivityLevel)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
            >
              <option value="sedentary">Stillasittande</option>
              <option value="moderate">Måttligt aktiv</option>
              <option value="active">Mycket aktiv</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Protein (g/kg)</label>
            <input
              type="number"
              step="0.1"
              value={proteinFactor}
              onChange={(e) => onProteinFactorChange(Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>
      )}

      {/* Calculated preview (calculate mode) */}
      {macroSourceMode === 'calculate' && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">Beräknade makros:</span>
            <button
              onClick={applyCalculatedMacros}
              className="text-sm text-gold-500 hover:text-gold-400 font-medium"
            >
              Applicera
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-orange-500/10 rounded-lg p-2">
              <div className="text-lg font-bold text-orange-400">{Math.round(calculatedMacros.kcal)}</div>
              <div className="text-xs text-zinc-500">kcal</div>
            </div>
            <div className="bg-rose-500/10 rounded-lg p-2">
              <div className="text-lg font-bold text-rose-400">{Math.round(calculatedMacros.protein)}g</div>
              <div className="text-xs text-zinc-500">Protein</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-400">{Math.round(calculatedMacros.carbs)}g</div>
              <div className="text-xs text-zinc-500">Kolhydrater</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2">
              <div className="text-lg font-bold text-amber-400">{Math.round(calculatedMacros.fat)}g</div>
              <div className="text-xs text-zinc-500">Fett</div>
            </div>
          </div>
        </div>
      )}

      {/* Manual input fields */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Kalorier</label>
          <input
            type="number"
            value={dayConfig.totalCalories}
            onChange={(e) => handleMacroChange('totalCalories', Number(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Protein (g)</label>
          <input
            type="number"
            value={dayConfig.totalProtein}
            onChange={(e) => handleMacroChange('totalProtein', Number(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Kolhydrater (g)</label>
          <input
            type="number"
            value={dayConfig.totalCarbs}
            onChange={(e) => handleMacroChange('totalCarbs', Number(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Fett (g)</label>
          <input
            type="number"
            value={dayConfig.totalFat}
            onChange={(e) => handleMacroChange('totalFat', Number(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Current day totals */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
        <span className="text-sm text-zinc-400">Dagens makros:</span>
        <div className="flex gap-3">
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-orange-500/20 text-orange-400">
            {dayConfig.totalCalories} kcal
          </span>
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-500/15 text-rose-400">
            P: {dayConfig.totalProtein}g
          </span>
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-500/15 text-blue-400">
            K: {dayConfig.totalCarbs}g
          </span>
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500/15 text-amber-400">
            F: {dayConfig.totalFat}g
          </span>
        </div>
      </div>
    </div>
  )
}
