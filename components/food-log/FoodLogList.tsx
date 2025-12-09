'use client'

import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { FoodLogEntry } from './FoodLogEntry'
import { UtensilsCrossed } from 'lucide-react'

export function FoodLogList() {
  const { logs, isLoading } = useFoodLogStore()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-1/4 mb-3" />
            <div className="h-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 text-center">
        <UtensilsCrossed className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-zinc-400">Inga loggade måltider</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Fota din mat, scanna streckkod eller importera data
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-zinc-300">Loggade måltider</h2>
      {logs.map(log => (
        <FoodLogEntry key={log.id} log={log} />
      ))}
    </div>
  )
}
