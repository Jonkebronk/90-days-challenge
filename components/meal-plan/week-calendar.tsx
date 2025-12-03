'use client'

interface DailyTarget {
  id: string
  dayOfWeek: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface WeekCalendarProps {
  dailyTargets: DailyTarget[]
  selectedDay: number
  onDaySelect: (day: number) => void
  defaultCalories?: number
}

const WEEKDAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

export function WeekCalendar({
  dailyTargets,
  selectedDay,
  onDaySelect,
  defaultCalories = 2000
}: WeekCalendarProps) {
  // Get current day of week (0 = Monday in our system)
  const today = new Date()
  const jsDay = today.getDay() // 0 = Sunday
  const currentDayOfWeek = jsDay === 0 ? 6 : jsDay - 1 // Convert to 0 = Monday

  // Get day number (1-7 for the week)
  const getWeekDayNumber = (dayIndex: number) => {
    const mondayDate = new Date(today)
    const diff = currentDayOfWeek - dayIndex
    mondayDate.setDate(today.getDate() - diff)
    return mondayDate.getDate()
  }

  // Get calories for a specific day
  const getCaloriesForDay = (dayOfWeek: number) => {
    const target = dailyTargets.find(t => t.dayOfWeek === dayOfWeek)
    return target ? Number(target.calories) : defaultCalories
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((label, index) => {
          const isToday = index === currentDayOfWeek
          const isSelected = index === selectedDay
          const calories = getCaloriesForDay(index)
          const dayNumber = getWeekDayNumber(index)

          return (
            <button
              key={index}
              onClick={() => onDaySelect(index)}
              className={`
                flex flex-col items-center p-2 rounded-lg transition-all
                ${isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}
              `}
            >
              {/* Weekday label */}
              <span className={`text-xs font-medium mb-1 ${
                isSelected ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {label}
              </span>

              {/* Day number with circle for today */}
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-1
                ${isToday && !isSelected ? 'bg-gray-900 text-white' : ''}
                ${isSelected ? 'text-white' : 'text-gray-900'}
              `}>
                {dayNumber}
              </div>

              {/* Calories */}
              <span className={`text-xs font-medium ${
                isSelected ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {calories}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
