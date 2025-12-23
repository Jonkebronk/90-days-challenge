'use client';

import { X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectedComponent, QuickTrackCategory } from '@/lib/social-meal/types';
import { QUICK_TRACK_CATEGORIES } from '@/lib/social-meal/quick-track-categories';

interface SelectedComponentsListProps {
  components: SelectedComponent[];
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
}

const categoryColors: Record<string, string> = {
  rose: 'bg-rose-50 border-rose-200',
  amber: 'bg-amber-50 border-amber-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
  orange: 'bg-orange-50 border-orange-200',
};

const portionLabels: Record<string, string> = {
  small: 'Liten',
  normal: 'Normal',
  large: 'Stor',
  extra: 'Extra stor',
  custom: 'Anpassad',
};

export function SelectedComponentsList({
  components,
  onRemove,
  onEdit,
}: SelectedComponentsListProps) {
  if (components.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Inga komponenter valda</p>
        <p className="text-sm mt-1">Välj en kategori och lägg till maträtter</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {components.map((component, index) => {
        const categoryDef = QUICK_TRACK_CATEGORIES[component.category as QuickTrackCategory];
        const color = categoryDef?.color || 'gray';

        return (
          <div
            key={`${component.foodItemId}-${index}`}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border',
              categoryColors[color] || 'bg-gray-50 border-gray-200'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{categoryDef?.icon || '🍽️'}</span>
              <div>
                <p className="font-medium text-gray-900">{component.foodItemName}</p>
                <p className="text-sm text-gray-600">
                  {portionLabels[component.portionSize] || component.portionSize} ({component.grams}g) •{' '}
                  <span className="font-medium">{component.kcal} kcal</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(index)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onRemove(index)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
