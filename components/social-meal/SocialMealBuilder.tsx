'use client';

import { useState } from 'react';
import { Plus, X, Trash2, Save, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductSelectModal } from '@/components/meal-plan-generator/ProductSelectModal';
import type { MacroCategory, CalculatedMacros } from '@/lib/types/meal-plan-generator';

interface MealItem {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: MacroCategory;
}

interface SocialMealBuilderProps {
  items: MealItem[];
  onAddItem: (item: MealItem) => void;
  onRemoveItem: (id: string) => void;
  onUpdateGrams: (id: string, grams: number) => void;
  onSave: () => void;
  onSaveAsFavorite: () => void;
  isSaving?: boolean;
}

const CATEGORIES: { key: MacroCategory; label: string; color: string; bgColor: string; icon: string }[] = [
  { key: 'protein', label: 'Proteinkällor', color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-100', icon: '🥩' },
  { key: 'carb', label: 'Kolhydrater', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-100', icon: '🍚' },
  { key: 'fat', label: 'Fettkällor', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-100', icon: '🧈' },
  { key: 'vegetable', label: 'Grönsaker', color: 'text-green-600', bgColor: 'bg-green-50 border-green-100', icon: '🥗' },
  { key: 'sauce', label: 'Sås', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-100', icon: '🫗' },
];

export function SocialMealBuilder({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateGrams,
  onSave,
  onSaveAsFavorite,
  isSaving = false,
}: SocialMealBuilderProps) {
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleOpenSelect = (category: MacroCategory) => {
    setSelectCategory(category);
    setSelectModalOpen(true);
  };

  const handleProductSelect = (
    product: { id: string; name: string; brand?: string | null; image?: string | null; kcal: number; protein: number; carbs: number; fat: number },
    grams: number,
    macros: CalculatedMacros
  ) => {
    if (!selectCategory) return;

    onAddItem({
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      brand: product.brand,
      image: product.image,
      grams,
      kcal: macros.kcal,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      category: selectCategory,
    });

    setSelectModalOpen(false);
    setSelectCategory(null);
  };

  const getItemsByCategory = (category: MacroCategory) => {
    return items.filter((item) => item.category === category);
  };

  return (
    <div className="space-y-4">
      {/* Category sections */}
      {CATEGORIES.map((cat) => {
        const categoryItems = getItemsByCategory(cat.key);

        return (
          <div
            key={cat.key}
            className={cn(
              'rounded-xl border p-4',
              cat.bgColor
            )}
          >
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className={cn('font-semibold text-sm', cat.color)}>
                  {cat.label}
                </span>
              </div>
              <button
                onClick={() => handleOpenSelect(cat.key)}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                  cat.color,
                  'hover:bg-white/50'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Lägg till
              </button>
            </div>

            {/* Items */}
            {categoryItems.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-2">
                Inga {cat.label.toLowerCase()} tillagda
              </p>
            ) : (
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2"
                  >
                    {/* Product image */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {cat.icon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {item.name}
                      </p>
                      {item.brand && (
                        <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.grams}
                          onChange={(e) => onUpdateGrams(item.id, parseInt(e.target.value) || 0)}
                          className="w-14 text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded px-1 py-0.5"
                          min="0"
                        />
                        <span className="text-xs text-gray-500">g</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-16 text-right">
                        {item.kcal.toFixed(0)} kcal
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-700">Totalt</span>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-xs text-gray-500">Kcal</div>
                <div className="font-bold text-amber-600">{totals.kcal.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Protein</div>
                <div className="font-bold text-rose-600">{totals.protein.toFixed(0)}g</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Kolh</div>
                <div className="font-bold text-amber-500">{totals.carbs.toFixed(0)}g</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Fett</div>
                <div className="font-bold text-yellow-600">{totals.fat.toFixed(0)}g</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onSaveAsFavorite}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors"
            >
              <Star className="h-4 w-4" />
              Spara som favorit
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Sparar...' : 'Logga måltid'}
            </button>
          </div>
        </div>
      )}

      {/* Product Select Modal */}
      {selectCategory && (
        <ProductSelectModal
          isOpen={selectModalOpen}
          onClose={() => {
            setSelectModalOpen(false);
            setSelectCategory(null);
          }}
          category={selectCategory}
          targetMacro={0}
          mealType="middag"
          onSelect={handleProductSelect}
        />
      )}
    </div>
  );
}
