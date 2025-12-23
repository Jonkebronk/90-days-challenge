'use client';

import { cn } from '@/lib/utils';
import type { QuickTrackCategory } from '@/lib/social-meal/types';
import { QUICK_TRACK_CATEGORIES } from '@/lib/social-meal/quick-track-categories';

interface CategorySelectorProps {
  selectedCategory: QuickTrackCategory | null;
  onSelect: (category: QuickTrackCategory) => void;
  disabledCategories?: QuickTrackCategory[];
}

const categoryColors: Record<string, string> = {
  rose: 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200',
  amber: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
  green: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  orange: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
};

const categoryColorsActive: Record<string, string> = {
  rose: 'bg-rose-500 border-rose-600 text-white',
  amber: 'bg-amber-500 border-amber-600 text-white',
  yellow: 'bg-yellow-500 border-yellow-600 text-white',
  green: 'bg-green-500 border-green-600 text-white',
  orange: 'bg-orange-500 border-orange-600 text-white',
};

export function CategorySelector({
  selectedCategory,
  onSelect,
  disabledCategories = [],
}: CategorySelectorProps) {
  const categories = Object.entries(QUICK_TRACK_CATEGORIES) as [
    QuickTrackCategory,
    typeof QUICK_TRACK_CATEGORIES[QuickTrackCategory]
  ][];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(([key, category]) => {
        const isSelected = selectedCategory === key;
        const isDisabled = disabledCategories.includes(key);

        return (
          <button
            key={key}
            onClick={() => !isDisabled && onSelect(key)}
            disabled={isDisabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium',
              isDisabled && 'opacity-40 cursor-not-allowed',
              isSelected
                ? categoryColorsActive[category.color]
                : categoryColors[category.color]
            )}
          >
            <span className="text-xl">{category.icon}</span>
            <span className="text-sm">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
