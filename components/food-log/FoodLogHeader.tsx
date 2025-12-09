'use client'

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'

export function FoodLogHeader() {
  const { selectedDate, setSelectedDate } = useFoodLogStore()

  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    if (diffDays === -1) return 'Imorgon'

    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = () => {
    const today = new Date()
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Matlogg</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToToday}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isToday()
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          {formatDate(selectedDate)}
        </button>

        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
