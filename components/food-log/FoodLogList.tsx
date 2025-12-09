'use client'

import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { FoodLogEntry } from './FoodLogEntry'
import { Card, CardContent } from '@/components/ui/card'
import { UtensilsCrossed } from 'lucide-react'

export function FoodLogList() {
  const { logs, isLoading } = useFoodLogStore()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white border border-gray-200">
            <CardContent className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-16 bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Inga loggade måltider</h3>
            <p className="text-gray-500">
              Fota din mat, scanna streckkod eller importera data
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Loggade måltider</h2>
      {logs.map(log => (
        <FoodLogEntry key={log.id} log={log} />
      ))}
    </div>
  )
}
