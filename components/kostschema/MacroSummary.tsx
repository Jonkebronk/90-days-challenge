'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MacroTargets } from '@/lib/kostschema/types'

interface MacroSummaryProps {
  macros: MacroTargets
}

export function MacroSummary({ macros }: MacroSummaryProps) {
  const macroItems = [
    { label: 'Kalorier', value: macros.kcal, unit: 'kcal', color: 'text-orange-400' },
    { label: 'Protein', value: macros.protein, unit: 'g', color: 'text-red-400' },
    { label: 'Kolhydrater', value: macros.carbs, unit: 'g', color: 'text-blue-400' },
    { label: 'Fett', value: macros.fat, unit: 'g', color: 'text-yellow-400' }
  ]

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">Beräknade makros per dag</CardTitle>
        {macros.tdee > 0 && (
          <p className="text-xs text-zinc-500">
            TDEE: {macros.tdee} kcal | Underskott: {macros.tdee - macros.kcal} kcal/dag
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {macroItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </div>
              <div className="text-xs text-zinc-500">{item.unit}</div>
              <div className="text-sm text-zinc-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
