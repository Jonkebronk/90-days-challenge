'use client';

import { cn } from '@/lib/utils';

interface MacroProgressBarProps {
  label: string;
  target: number;
  actual: number;
  unit?: string;
  color?: 'protein' | 'carbs' | 'fat' | 'kcal';
}

const colorMap = {
  protein: {
    bg: 'bg-pink-100',
    fill: 'bg-pink-500',
    text: 'text-pink-700',
  },
  carbs: {
    bg: 'bg-teal-100',
    fill: 'bg-teal-500',
    text: 'text-teal-700',
  },
  fat: {
    bg: 'bg-amber-100',
    fill: 'bg-amber-500',
    text: 'text-amber-700',
  },
  kcal: {
    bg: 'bg-blue-100',
    fill: 'bg-blue-500',
    text: 'text-blue-700',
  },
};

export function MacroProgressBar({
  label,
  target,
  actual,
  unit = 'g',
  color = 'protein',
}: MacroProgressBarProps) {
  const percentage = target > 0 ? Math.min((actual / target) * 100, 120) : 0;
  const diff = actual - target;
  const isOver = diff > 0;
  const isUnder = diff < -5; // More than 5g under
  const colors = colorMap[color];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-medium', colors.text)}>{label}</span>
        <span className="text-gray-600">
          {actual.toFixed(1)}{unit} / {target.toFixed(1)}{unit}
          {diff !== 0 && (
            <span
              className={cn(
                'ml-2 text-xs',
                isOver ? 'text-red-500' : isUnder ? 'text-amber-500' : 'text-green-500'
              )}
            >
              ({isOver ? '+' : ''}{diff.toFixed(1)}{unit})
            </span>
          )}
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', colors.bg)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            colors.fill,
            percentage > 105 && 'bg-red-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
