'use client'

import { useState } from 'react'
import { Camera, Barcode, FileJson, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useFoodLogStore, FoodLog } from '@/lib/stores/food-log-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  log: FoodLog
}

const typeConfig = {
  ai: { icon: Camera, label: 'AI-analys', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  barcode: { icon: Barcode, label: 'Streckkod', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  manual: { icon: FileJson, label: 'Manuell', color: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export function FoodLogEntry({ log }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { deleteLog } = useFoodLogStore()

  const config = typeConfig[log.type] || typeConfig.manual
  const Icon = config.icon

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  }

  const handleDelete = async () => {
    if (confirm('Ta bort denna matlogg?')) {
      await deleteLog(log.id)
    }
  }

  return (
    <Card className="bg-white border border-gray-200 overflow-hidden">
      {/* Header - clickable */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-primary/20 to-orange-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gold-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {log.items.length} {log.items.length === 1 ? 'produkt' : 'produkter'}
              </span>
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">{formatTime(log.time)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-bold bg-gradient-to-r from-gold-primary to-orange-500 bg-clip-text text-transparent">
              {Math.round(log.totalKcal)} kcal
            </div>
            <div className="text-xs text-gray-500">
              P: {Math.round(log.totalProtein)}g · K: {Math.round(log.totalCarbs)}g · F: {Math.round(log.totalFat)}g
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Items list */}
          <div className="p-4 space-y-2">
            {log.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{Math.round(item.portionG)}g</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gold-primary">{Math.round(item.kcal)} kcal</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(item.protein)}p · {Math.round(item.carbs)}k · {Math.round(item.fat)}f
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes if any */}
          {log.notes && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3">{log.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Ta bort
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
