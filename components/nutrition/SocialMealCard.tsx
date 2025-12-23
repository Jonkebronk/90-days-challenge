'use client';

import { Users, Trash2, Pencil } from 'lucide-react';

interface SocialMealCardProps {
  timestamp: Date;
  components: Array<{
    id: string;
    category: string;
    foodItemName: string;
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalNutrition: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  protein: '🥩',
  carb: '🍚',
  fat: '🧈',
  vegetable: '🥗',
  sauce: '🫗',
};

export function SocialMealCard({
  timestamp,
  components,
  totalNutrition,
  onEdit,
  onDelete,
}: SocialMealCardProps) {
  const formatDate = (date: Date) => {
    const targetDate = new Date(date);
    return targetDate.toLocaleDateString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-3 flex items-center justify-between border-b border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Social Middag</h3>
            <p className="text-sm text-purple-600">{formatDate(timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="text-lg font-bold text-purple-700">{totalNutrition.kcal} kcal</p>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-purple-500 hover:text-purple-700 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-purple-500 hover:text-red-500 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Components */}
      <div className="p-4 space-y-2">
        {components.map((comp) => (
          <div
            key={comp.id}
            className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2"
          >
            <span className="text-lg">{CATEGORY_ICONS[comp.category] || '🍽️'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800 truncate">
                {comp.foodItemName}
              </p>
              <p className="text-xs text-gray-500">{comp.grams}g</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-700">{comp.kcal} kcal</p>
              <p className="text-xs text-gray-500">
                P: {comp.protein.toFixed(0)}g
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with macros */}
      <div className="px-4 py-3 bg-white/40 border-t border-purple-100 flex justify-between items-center">
        <span className="text-sm font-medium text-purple-700">Totalt:</span>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <span className="font-bold text-rose-600">{totalNutrition.protein.toFixed(0)}g</span>
            <span className="text-xs text-gray-500 ml-1">P</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-amber-600">{totalNutrition.carbs.toFixed(0)}g</span>
            <span className="text-xs text-gray-500 ml-1">K</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-yellow-600">{totalNutrition.fat.toFixed(0)}g</span>
            <span className="text-xs text-gray-500 ml-1">F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
