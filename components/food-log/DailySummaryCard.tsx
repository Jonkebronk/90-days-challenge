'use client'

import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Flame, Beef, Wheat, Droplet } from 'lucide-react'

interface MacroProgressProps {
  label: string
  icon: React.ReactNode
  current: number
  target: number | null
  unit: string
  color: string
}

function MacroProgress({ label, icon, current, target, unit, color }: MacroProgressProps) {
  const percentage = target && target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOver = target && current > target

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className={isOver ? 'text-red-400' : 'text-white'}>
          {Math.round(current)}
          {target && <span className="text-zinc-500">/{Math.round(target)}</span>}
          <span className="text-zinc-500 ml-1">{unit}</span>
        </span>
      </div>
      {target && (
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color} ${
              isOver ? 'bg-red-500' : ''
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function DailySummaryCard() {
  const { dailySummary } = useFoodLogStore()

  if (!dailySummary) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="space-y-4">
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
        </div>
      </div>
    )
  }

  const { logged, targets } = dailySummary

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-300">Dagens intag</h2>
        {dailySummary.logCount > 0 && (
          <span className="text-sm text-zinc-500">
            {dailySummary.logCount} {dailySummary.logCount === 1 ? 'måltid' : 'måltider'}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <MacroProgress
          label="Kalorier"
          icon={<Flame className="w-4 h-4" />}
          current={logged.kcal}
          target={targets?.kcal || null}
          unit="kcal"
          color="bg-orange-500"
        />

        <MacroProgress
          label="Protein"
          icon={<Beef className="w-4 h-4" />}
          current={logged.protein}
          target={targets?.protein || null}
          unit="g"
          color="bg-red-500"
        />

        <MacroProgress
          label="Kolhydrater"
          icon={<Wheat className="w-4 h-4" />}
          current={logged.carbs}
          target={targets?.carbs || null}
          unit="g"
          color="bg-amber-500"
        />

        <MacroProgress
          label="Fett"
          icon={<Droplet className="w-4 h-4" />}
          current={logged.fat}
          target={targets?.fat || null}
          unit="g"
          color="bg-yellow-500"
        />
      </div>

      {!targets && (
        <p className="text-sm text-zinc-500 text-center pt-2">
          Skapa ett kostschema för att se mål
        </p>
      )}
    </div>
  )
}
