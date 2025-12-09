'use client'

import { useEffect } from 'react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { FoodLogHeader } from '@/components/food-log/FoodLogHeader'
import { DailySummaryCard } from '@/components/food-log/DailySummaryCard'
import { InputMethodTabs } from '@/components/food-log/InputMethodTabs'
import { FoodLogList } from '@/components/food-log/FoodLogList'

export default function FoodLogPage() {
  const { selectedDate, fetchLogs, fetchDailySummary } = useFoodLogStore()

  useEffect(() => {
    fetchLogs()
    fetchDailySummary()
  }, [selectedDate, fetchLogs, fetchDailySummary])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <FoodLogHeader />
        <DailySummaryCard />
        <InputMethodTabs />
        <FoodLogList />
      </div>
    </div>
  )
}
