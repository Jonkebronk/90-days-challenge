'use client';

import { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductSelectModal } from './ProductSelectModal';
import type { MacroCategory, MealType, CalculatedMacros } from '@/lib/types/meal-plan-generator';

interface SelectedProduct {
  id: string;
  name: string;
  image?: string | null;
  grams: number;
  macros: CalculatedMacros;
}

interface BuildYourOwnMealProps {
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  mealType: MealType;
  onApply: (items: { category: MacroCategory; product: SelectedProduct }[]) => void;
  disabled?: boolean;
}

const categoryConfig: { category: MacroCategory; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { category: 'protein', label: 'Protein', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { category: 'carb', label: 'Kolhydrater', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { category: 'fat', label: 'Fett', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
];

export function BuildYourOwnMeal({ targetMacros, mealType, onApply, disabled = false }: BuildYourOwnMealProps) {
  const [selectedItems, setSelectedItems] = useState<Record<MacroCategory, SelectedProduct | null>>({
    protein: null,
    carb: null,
    fat: null,
    vegetable: null,
    sauce: null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MacroCategory | null>(null);

  const handleOpenModal = (category: MacroCategory) => {
    setActiveCategory(category);
    setModalOpen(true);
  };

  const handleSelectProduct = (
    product: { id: string; name: string; image?: string | null },
    grams: number,
    macros: CalculatedMacros
  ) => {
    if (activeCategory) {
      setSelectedItems(prev => ({
        ...prev,
        [activeCategory]: { ...product, grams, macros },
      }));
    }
    setModalOpen(false);
  };

  const handleRemoveItem = (category: MacroCategory) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: null,
    }));
  };

  const handleApply = () => {
    const items = Object.entries(selectedItems)
      .filter(([_, product]) => product !== null)
      .map(([category, product]) => ({
        category: category as MacroCategory,
        product: product!,
      }));

    if (items.length > 0) {
      onApply(items);
      // Clear selections after applying
      setSelectedItems({
        protein: null,
        carb: null,
        fat: null,
        vegetable: null,
        sauce: null,
      });
    }
  };

  // Calculate totals
  const totals = Object.values(selectedItems).reduce(
    (acc, item) => {
      if (item) {
        acc.protein += item.macros.protein;
        acc.carbs += item.macros.carbs;
        acc.fat += item.macros.fat;
        acc.kcal += item.macros.kcal;
      }
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  );

  const hasAnySelection = Object.values(selectedItems).some(item => item !== null);

  const getTargetMacro = (category: MacroCategory): number => {
    switch (category) {
      case 'protein':
        return targetMacros.protein;
      case 'carb':
        return targetMacros.carbs;
      case 'fat':
        return targetMacros.fat;
      default:
        return 0;
    }
  };

  return (
    <div className="border-2 border-dashed border-zinc-300 rounded-xl p-4 bg-zinc-50/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-zinc-600" />
        <h4 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
          Bygg din egen måltid
        </h4>
      </div>

      {/* Target macros info */}
      <div className="text-xs text-zinc-500 mb-4">
        Måltidsmål: <span className="font-medium text-zinc-700">{Math.round(targetMacros.protein)}g protein</span> |{' '}
        <span className="font-medium text-zinc-700">{Math.round(targetMacros.carbs)}g kolhydrater</span> |{' '}
        <span className="font-medium text-zinc-700">{Math.round(targetMacros.fat)}g fett</span>
      </div>

      {/* Category slots */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {categoryConfig.map(({ category, label, color, bgColor, borderColor }) => {
          const selected = selectedItems[category];

          return (
            <div key={category} className={`rounded-lg p-3 ${bgColor} border ${borderColor}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
                {label}
              </span>

              {selected ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    {selected.image ? (
                      <img
                        src={selected.image}
                        alt={selected.name}
                        className="w-8 h-8 rounded object-cover bg-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        <span className="text-zinc-300 text-[8px]">Bild</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900">{Math.round(selected.grams)}g</p>
                      <p className="text-[10px] text-zinc-600 truncate">{selected.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(category)}
                      disabled={disabled}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenModal(category)}
                  disabled={disabled}
                  className="mt-2 w-full py-2 rounded-md border-2 border-dashed border-zinc-300 hover:border-zinc-400 transition-colors flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                >
                  <Plus className="w-3 h-3" />
                  Lägg till
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals and apply button */}
      {hasAnySelection && (
        <div className="pt-3 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-600">
              Totalt:{' '}
              <span className="font-medium">{Math.round(totals.protein)}g P</span> |{' '}
              <span className="font-medium">{Math.round(totals.carbs)}g K</span> |{' '}
              <span className="font-medium">{Math.round(totals.fat)}g F</span> |{' '}
              <span className="font-medium">{Math.round(totals.kcal)} kcal</span>
            </div>
            <Button
              onClick={handleApply}
              disabled={disabled}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
            >
              Använd denna kombination
            </Button>
          </div>
        </div>
      )}

      {/* Product Select Modal */}
      {activeCategory && (
        <ProductSelectModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          category={activeCategory}
          targetMacro={getTargetMacro(activeCategory)}
          mealType={mealType}
          onSelect={handleSelectProduct}
        />
      )}
    </div>
  );
}
