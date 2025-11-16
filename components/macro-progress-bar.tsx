interface MacroProgressBarProps {
  label: string
  current: number
  percentage: number
  color: 'protein' | 'carbs' | 'fat'
}

const colorClasses = {
  protein: {
    bg: 'bg-pink-500',
    text: 'text-pink-700',
    light: 'bg-pink-100'
  },
  carbs: {
    bg: 'bg-teal-500',
    text: 'text-teal-700',
    light: 'bg-teal-100'
  },
  fat: {
    bg: 'bg-purple-500',
    text: 'text-purple-700',
    light: 'bg-purple-100'
  }
}

export function MacroProgressBar({ label, current, percentage, color }: MacroProgressBarProps) {
  const colors = colorClasses[color]

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {current}g / {percentage}%
        </span>
      </div>
      <div className={`w-full h-2 ${colors.light} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colors.bg} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
