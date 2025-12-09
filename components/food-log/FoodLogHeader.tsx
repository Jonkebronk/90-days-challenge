'use client'

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useFoodLogStore } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'

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
    <div className="text-center">
      {/* Gold line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />

      {/* Title */}
      <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
        Matlogg
      </h1>

      {/* Gold line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeDate(-1)}
          className="border-gray-300 hover:bg-gold-primary/10 hover:border-gold-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          onClick={goToToday}
          className={`px-6 font-medium transition-all ${
            isToday()
              ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] border-transparent hover:opacity-90'
              : 'border-gray-300 hover:bg-gold-primary/10 hover:border-gold-primary'
          }`}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {formatDate(selectedDate)}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => changeDate(1)}
          className="border-gray-300 hover:bg-gold-primary/10 hover:border-gold-primary"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
