import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Day {
  dayNumber: number
  name: string
}

interface DayTabsProps {
  days: Day[]
  selectedIndex: number
  onSelectDay: (index: number) => void
  onAddDay: () => void
  onRemoveDay: (index: number) => void
}

export function DayTabs({ days, selectedIndex, onSelectDay, onAddDay, onRemoveDay }: DayTabsProps) {
  return (
    <div className="border-b border-[rgba(255,215,0,0.2)] mb-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day, index) => (
          <div key={index} className="relative group flex-shrink-0">
            <button
              onClick={() => onSelectDay(index)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative",
                selectedIndex === index
                  ? "text-[rgba(255,255,255,0.95)] border-b-2 border-[#FFD700]"
                  : "text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.8)] border-b-2 border-transparent hover:border-[rgba(255,215,0,0.3)]"
              )}
            >
              {day.name}
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-[rgba(255,215,0,0.05)] rounded-t-md -z-10" />
              )}
            </button>
            {days.length > 1 && selectedIndex === index && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveDay(index)
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[rgba(255,100,100,0.8)] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#ff6464]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <Button
          onClick={onAddDay}
          size="sm"
          variant="ghost"
          className="flex-shrink-0 text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] ml-2"
        >
          <Plus className="w-4 h-4 mr-1" />
          Lägg till dag
        </Button>
      </div>
    </div>
  )
}
