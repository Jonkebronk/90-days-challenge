'use client'

import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Beef, Wheat, Droplet } from 'lucide-react'

interface MacroProgressProps {
  label: string
  icon: React.ReactNode
  current: number
  target: number | null
  unit: string
  colorClass: string
}

function MacroProgress({ label, icon, current, target, unit, colorClass }: MacroProgressProps) {
  const percentage = target && target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOver = target && current > target

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <span className={colorClass}>{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <span className={`font-semibold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>
          {Math.round(current)}
          {target && <span className="text-gray-400 font-normal">/{Math.round(target)}</span>}
          <span className="text-gray-400 font-normal ml-1">{unit}</span>
        </span>
      </div>
      {target && (
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOver ? 'bg-red-500' : colorClass.replace('text-', 'bg-')
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
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="space-y-3">
              <div className="h-8 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { logged, targets } = dailySummary

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Dagens intag</CardTitle>
          {dailySummary.logCount > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {dailySummary.logCount} {dailySummary.logCount === 1 ? 'måltid' : 'måltider'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MacroProgress
          label="Kalorier"
          icon={<Flame className="w-4 h-4" />}
          current={logged.kcal}
          target={targets?.kcal || null}
          unit="kcal"
          colorClass="text-orange-500"
        />

        <MacroProgress
          label="Protein"
          icon={<Beef className="w-4 h-4" />}
          current={logged.protein}
          target={targets?.protein || null}
          unit="g"
          colorClass="text-red-500"
        />

        <MacroProgress
          label="Kolhydrater"
          icon={<Wheat className="w-4 h-4" />}
          current={logged.carbs}
          target={targets?.carbs || null}
          unit="g"
          colorClass="text-amber-500"
        />

        <MacroProgress
          label="Fett"
          icon={<Droplet className="w-4 h-4" />}
          current={logged.fat}
          target={targets?.fat || null}
          unit="g"
          colorClass="text-yellow-500"
        />

        {!targets && (
          <p className="text-sm text-gray-500 text-center pt-2 border-t border-gray-100">
            Skapa ett kostschema för att se mål
          </p>
        )}
      </CardContent>
    </Card>
  )
}
