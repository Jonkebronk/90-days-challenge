interface MacroBadgeProps {
  type: 'protein' | 'carbs' | 'fat'
  value: number
  size?: 'sm' | 'md'
}

const badgeStyles = {
  protein: 'bg-pink-100 text-pink-700 border-pink-300',
  carbs: 'bg-teal-100 text-teal-700 border-teal-300',
  fat: 'bg-purple-100 text-purple-700 border-purple-300'
}

const labels = {
  protein: 'p',
  carbs: 'c',
  fat: 'f'
}

export function MacroBadge({ type, value, size = 'sm' }: MacroBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`${badgeStyles[type]} ${sizeClasses} font-medium border rounded-md`}>
      {Math.round(value)}{labels[type]}
    </span>
  )
}
