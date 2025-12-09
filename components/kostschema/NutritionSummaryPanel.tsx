'use client'

import { Micronutrients } from '@/lib/kostschema/types'
import { RDI, MICRONUTRIENT_KEYS, calculateRDIPercent, getRDIColorClass, getRDITextColorClass } from '@/lib/kostschema/rdi-constants'
import { Loader2 } from 'lucide-react'

interface NutritionSummaryPanelProps {
  micronutrients: Micronutrients
  isLoading?: boolean
}

export function NutritionSummaryPanel({ micronutrients, isLoading }: NutritionSummaryPanelProps) {
  // Split into vitamins and minerals
  const vitamins = MICRONUTRIENT_KEYS.filter(key => RDI[key]?.category === 'vitamin')
  const minerals = MICRONUTRIENT_KEYS.filter(key => RDI[key]?.category === 'mineral')

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Laddar mikronutrienter...</span>
        </div>
      </div>
    )
  }

  // Check if we have any micronutrient data
  const hasData = MICRONUTRIENT_KEYS.some(key => micronutrients[key as keyof Micronutrients] !== null)

  if (!hasData) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Mikronutrienter</h3>
        <p className="text-zinc-500 text-sm">
          Mikronutrientdata visas endast for ingredienser med SLV-nummer
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Mikronutrienter</h3>
        <p className="text-zinc-500 text-sm">% av rekommenderat dagligt intag (RDI)</p>
      </div>

      {/* Bar Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitamins */}
        <div>
          <h4 className="text-sm font-medium text-gold-500 mb-3">Vitaminer</h4>
          <div className="space-y-2">
            {vitamins.map(key => {
              const value = micronutrients[key as keyof Micronutrients]
              const percent = calculateRDIPercent(key, value)
              const rdiInfo = RDI[key]

              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-24 truncate">{rdiInfo.name}</span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRDIColorClass(percent)} transition-all duration-300`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${getRDITextColorClass(percent)}`}>
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Minerals */}
        <div>
          <h4 className="text-sm font-medium text-gold-500 mb-3">Mineraler</h4>
          <div className="space-y-2">
            {minerals.map(key => {
              const value = micronutrients[key as keyof Micronutrients]
              const percent = calculateRDIPercent(key, value)
              const rdiInfo = RDI[key]

              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-24 truncate">{rdiInfo.name}</span>
                  <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRDIColorClass(percent)} transition-all duration-300`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${getRDITextColorClass(percent)}`}>
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Detaljerade värden</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                <th className="text-left py-2 px-2">Näringsämne</th>
                <th className="text-right py-2 px-2">Värde</th>
                <th className="text-right py-2 px-2">Enhet</th>
                <th className="text-right py-2 px-2">RDI</th>
                <th className="text-right py-2 px-2">%</th>
              </tr>
            </thead>
            <tbody>
              {MICRONUTRIENT_KEYS.map(key => {
                const value = micronutrients[key as keyof Micronutrients]
                const percent = calculateRDIPercent(key, value)
                const rdiInfo = RDI[key]

                return (
                  <tr key={key} className="border-b border-zinc-800/50">
                    <td className="py-2 px-2 text-zinc-300">{rdiInfo.name}</td>
                    <td className="py-2 px-2 text-right text-white font-medium">
                      {value !== null ? value.toFixed(1) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right text-zinc-500">{rdiInfo.unit}</td>
                    <td className="py-2 px-2 text-right text-zinc-500">{rdiInfo.value}</td>
                    <td className={`py-2 px-2 text-right font-medium ${getRDITextColorClass(percent)}`}>
                      {percent}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>80-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>&gt;100%</span>
        </div>
      </div>
    </div>
  )
}
