'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Utensils, Leaf, RefreshCw, X, Cherry } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MacroBadge } from './MacroBadge';
import { ProductSelectModal } from './ProductSelectModal';
import { cn } from '@/lib/utils';
import type {
  GeneratedMeal,
  MacroCategory,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';

interface ProductForSelect {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RecipeSuggestion {
  id: string;
  name: string;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ClientStyleMealCardProps {
  meal: GeneratedMeal;
  mealIndex: number;
  mealNumber?: number;
  onSwapFood: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onSelectFood?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => void;
  onRemoveFood?: (mealIndex: number, category: MacroCategory, foodId?: string) => void;
  onRemoveAlternative?: (mealIndex: number, category: MacroCategory, foodId: string) => void;
  onAddAlternative?: (mealIndex: number, category: MacroCategory, product: ProductForSelect, grams: number, macros: CalculatedMacros) => void;
  onAddSauce: (mealIndex: number) => void;
  onRemoveSauce: (mealIndex: number) => void;
  onUpdateGrams?: (mealIndex: number, category: MacroCategory, grams: number, foodId?: string) => void;
  onUpdateMealMacros?: (mealIndex: number, targetMacros: CalculatedMacros) => void;
  disabled?: boolean;
  recipeSuggestions?: RecipeSuggestion[];
  onSelectRecipe?: (mealIndex: number, recipeId: string) => void;
}

// Category styling config with distinct colors
const CATEGORY_CONFIG: Record<string, {
  bg: string;
  border: string;
  headerBg: string;
  text: string;
  label: string;
  icon?: string;
}> = {
  protein: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    headerBg: 'bg-rose-100',
    text: 'text-rose-700',
    label: 'Proteinkällor',
    icon: '🥩'
  },
  carb: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    headerBg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Kolhydrater',
    icon: '🌾'
  },
  fat: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    headerBg: 'bg-sky-100',
    text: 'text-sky-700',
    label: 'Fettkällor',
    icon: '🥑'
  },
  vegetable: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-100',
    text: 'text-emerald-700',
    label: 'Grönsaker',
    icon: '🥬'
  },
  berry: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    headerBg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Bär',
    icon: '🫐'
  },
  sauce: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    headerBg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Sås',
    icon: '🥫'
  },
};

// Helper to check if a food is a berry
function isBerry(name: string): boolean {
  const nameLower = name.toLowerCase();
  return nameLower.includes('bär') || nameLower.includes('hallon') ||
         nameLower.includes('blåbär') || nameLower.includes('jordgubb') ||
         nameLower.includes('björnbär') || nameLower.includes('lingon') ||
         nameLower.includes('krusbär') || nameLower.includes('vinbär');
}

export function ClientStyleMealCard({
  meal,
  mealIndex,
  mealNumber,
  onSelectFood,
  onRemoveFood,
  onAddSauce,
  onRemoveSauce,
  onUpdateGrams,
  disabled = false,
  recipeSuggestions = [],
  onSelectRecipe,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Modal state for product selection
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);
  const [selectTargetMacro, setSelectTargetMacro] = useState(0);

  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  // Get items by category - separate berries from other carbs
  const proteinItems = meal.items.filter(item => item.category === 'protein');
  const carbItems = meal.items.filter(item => item.category === 'carb' && !isBerry(item.selected.name));
  const berryItems = meal.items.filter(item => item.category === 'carb' && isBerry(item.selected.name));
  const fatItems = meal.items.filter(item => item.category === 'fat');
  const vegetableItems = meal.items.filter(item => item.category === 'vegetable');

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';
  const hasVegetables = meal.vegetableGrams > 0 || vegetableItems.length > 0;

  // Open product select modal
  const handleOpenSelectModal = (category: MacroCategory, targetMacro: number) => {
    setSelectCategory(category);
    setSelectTargetMacro(targetMacro);
    setSelectModalOpen(true);
  };

  // Handle product selection from modal
  const handleProductSelect = (product: ProductForSelect, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => {
    if (selectCategory && onSelectFood) {
      onSelectFood(mealIndex, selectCategory, product, grams, macros, isAlternative);
    }
    setSelectModalOpen(false);
  };

  // Handle grams adjustment for a specific food item
  const adjustGrams = (category: MacroCategory, foodId: string, delta: number) => {
    const item = meal.items.find(i => i.category === category && i.selected.foodId === foodId);
    if (item && onUpdateGrams) {
      const newGrams = Math.max(10, item.selected.grams + delta);
      onUpdateGrams(mealIndex, category, newGrams, foodId);
    }
  };

  // Get target macro for category
  const getTargetMacro = (category: MacroCategory): number => {
    switch (category) {
      case 'protein': return meal.targetMacros?.protein || 30;
      case 'carb': return meal.targetMacros?.carbs || 30;
      case 'fat': return meal.targetMacros?.fat || 15;
      default: return 0;
    }
  };

  // Render a single food item within a section
  const renderFoodItem = (
    item: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros } },
    category: MacroCategory,
    configKey: string
  ) => {
    const config = CATEGORY_CONFIG[configKey];
    return (
      <div
        key={item.selected.foodId}
        className={cn("flex items-center gap-3 p-2.5 rounded-lg", config.bg)}
      >
        {/* Food name and grams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 truncate text-sm">
              {item.selected.name}
            </span>
            <span className="text-sm font-semibold text-zinc-500">
              {item.selected.grams}g
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => adjustGrams(category, item.selected.foodId, -10)}
            disabled={disabled || item.selected.grams <= 10}
            className="p-1 rounded hover:bg-white/50 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Minska 10g"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => adjustGrams(category, item.selected.foodId, 10)}
            disabled={disabled}
            className="p-1 rounded hover:bg-white/50 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Öka 10g"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => !disabled && handleOpenSelectModal(category, getTargetMacro(category))}
            disabled={disabled}
            className="p-1 rounded hover:bg-white/50 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            title="Byt livsmedel"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {onRemoveFood && (
            <button
              onClick={() => !disabled && onRemoveFood(mealIndex, category, item.selected.foodId)}
              disabled={disabled}
              className="p-1 rounded hover:bg-red-100 text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors"
              title="Ta bort"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render a complete category section with header
  const renderCategorySection = (
    items: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros }; isAlternative?: boolean }[],
    category: MacroCategory,
    configKey: string,
    showAddButton: boolean = true
  ) => {
    const config = CATEGORY_CONFIG[configKey];
    const targetMacro = getTargetMacro(category);

    // Separate primary items from alternatives
    const primaryItems = items.filter(item => !item.isAlternative);
    const alternativeItems = items.filter(item => item.isAlternative);

    return (
      <div key={configKey} className={cn("rounded-xl overflow-hidden border", config.border)}>
        {/* Section header */}
        <div className={cn("px-3 py-2 flex items-center justify-between", config.headerBg)}>
          <div className="flex items-center gap-2">
            <span className="text-base">{config.icon}</span>
            <span className={cn("font-semibold text-sm", config.text)}>{config.label}</span>
          </div>
          {showAddButton && (
            <button
              onClick={() => !disabled && handleOpenSelectModal(category, targetMacro)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                "bg-white/60 hover:bg-white", config.text
              )}
            >
              <Plus className="h-3 w-3" />
              Lägg till
            </button>
          )}
        </div>

        {/* Items */}
        <div className={cn("p-2", config.bg)}>
          {items.length > 0 ? (
            <div className="space-y-1.5">
              {/* Primary items */}
              {primaryItems.map((item, index) => (
                <div key={item.selected.foodId}>
                  {renderFoodItem(item, category, configKey)}
                  {/* Show ELLER between primary items if there are alternatives or more primaries */}
                  {index < primaryItems.length - 1 && (
                    <div className="flex items-center justify-center py-1.5">
                      <span className="text-xs font-bold text-amber-500 tracking-wider">ELLER</span>
                    </div>
                  )}
                </div>
              ))}

              {/* ELLER separator before alternatives */}
              {primaryItems.length > 0 && alternativeItems.length > 0 && (
                <div className="flex items-center justify-center py-1.5">
                  <span className="text-xs font-bold text-amber-500 tracking-wider">ELLER</span>
                </div>
              )}

              {/* Alternative items */}
              {alternativeItems.map((item, index) => (
                <div key={item.selected.foodId}>
                  {renderFoodItem(item, category, configKey)}
                  {index < alternativeItems.length - 1 && (
                    <div className="flex items-center justify-center py-1.5">
                      <span className="text-xs font-bold text-amber-500 tracking-wider">ELLER</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-sm text-zinc-400 italic">
              Inga {config.label.toLowerCase()} tillagda
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Icon + Name */}
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-semibold text-zinc-900">{mealLabel}</span>
          </div>

          {/* Right side: Macro badges + Chevron */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <MacroBadge label="K" value={meal.totalMacros.kcal} color="green" />
              <MacroBadge label="P" value={meal.totalMacros.protein} color="red" />
              <MacroBadge label="F" value={meal.totalMacros.fat} color="blue" />
              <MacroBadge label="C" value={meal.totalMacros.carbs} color="amber" />
            </div>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {/* MAKRONÄRINGSÄMNEN - Huvudsektioner */}
          <div className="space-y-3">
            {/* Proteinkällor */}
            {renderCategorySection(proteinItems, 'protein', 'protein')}

            {/* Kolhydrater */}
            {renderCategorySection(carbItems, 'carb', 'carb')}

            {/* Fettkällor */}
            {renderCategorySection(fatItems, 'fat', 'fat')}
          </div>

          {/* TILLBEHÖR - Separata sektioner */}
          <div className="pt-2 border-t border-zinc-200">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Tillbehör
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Grönsaker */}
              <div className={cn("rounded-xl overflow-hidden border", CATEGORY_CONFIG.vegetable.border)}>
                <div className={cn("px-3 py-2 flex items-center justify-between", CATEGORY_CONFIG.vegetable.headerBg)}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_CONFIG.vegetable.icon}</span>
                    <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.vegetable.text)}>
                      {CATEGORY_CONFIG.vegetable.label}
                    </span>
                  </div>
                </div>
                <div className={cn("p-2", CATEGORY_CONFIG.vegetable.bg)}>
                  {hasVegetables ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                      <Leaf className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-zinc-700">{VEGETABLE_GRAMS}g valfritt</span>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-zinc-400 italic">
                      Valfritt
                    </div>
                  )}
                </div>
              </div>

              {/* Bär */}
              <div className={cn("rounded-xl overflow-hidden border", CATEGORY_CONFIG.berry.border)}>
                <div className={cn("px-3 py-2 flex items-center justify-between", CATEGORY_CONFIG.berry.headerBg)}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_CONFIG.berry.icon}</span>
                    <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.berry.text)}>
                      {CATEGORY_CONFIG.berry.label}
                    </span>
                  </div>
                  <button
                    onClick={() => !disabled && handleOpenSelectModal('carb', 0)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      "bg-white/60 hover:bg-white", CATEGORY_CONFIG.berry.text
                    )}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className={cn("p-2 space-y-1.5", CATEGORY_CONFIG.berry.bg)}>
                  {berryItems.length > 0 ? (
                    berryItems.map(item => renderFoodItem(item, 'carb', 'berry'))
                  ) : (
                    <div className="text-center py-2 text-sm text-zinc-400 italic">
                      Inga bär tillagda
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sås - endast för lunch/middag */}
          {canHaveSauce && (
            <div className={cn("rounded-xl overflow-hidden border", CATEGORY_CONFIG.sauce.border)}>
              <div className={cn("px-3 py-2 flex items-center justify-between", CATEGORY_CONFIG.sauce.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_CONFIG.sauce.icon}</span>
                  <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.sauce.text)}>
                    {CATEGORY_CONFIG.sauce.label}
                  </span>
                </div>
                {!meal.sauce && (
                  <button
                    onClick={() => onAddSauce(mealIndex)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      "bg-white/60 hover:bg-white", CATEGORY_CONFIG.sauce.text
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Lägg till
                  </button>
                )}
              </div>
              <div className={cn("p-2", CATEGORY_CONFIG.sauce.bg)}>
                {meal.sauce ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                    <span className="flex-1 text-sm text-zinc-700">
                      {meal.sauce.name} <span className="text-zinc-500">{Math.round(meal.sauce.grams)}g</span>
                    </span>
                    <button
                      onClick={() => onRemoveSauce(mealIndex)}
                      disabled={disabled}
                      className="p-1 rounded hover:bg-red-100 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 text-sm text-zinc-400 italic">
                    Ingen sås tillagd
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receptförslag */}
          {recipeSuggestions.length > 0 && (
            <div className="pt-3 mt-2 border-t border-zinc-200">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Receptförslag
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {recipeSuggestions.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => onSelectRecipe?.(mealIndex, recipe.id)}
                    disabled={disabled}
                    className="flex-shrink-0 group cursor-pointer"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-100 mb-1.5">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Utensils className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-700 text-center line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {recipe.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Totals summary */}
          <div className="pt-3 mt-2 border-t border-zinc-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-500 uppercase tracking-wide">Totalt</span>
              <div className="flex items-center gap-3 text-zinc-600">
                <span><span className="font-semibold text-rose-600">P</span> {meal.totalMacros.protein.toFixed(0)}g</span>
                <span><span className="font-semibold text-amber-600">K</span> {meal.totalMacros.carbs.toFixed(0)}g</span>
                <span><span className="font-semibold text-sky-600">F</span> {meal.totalMacros.fat.toFixed(0)}g</span>
                <span className="font-semibold text-zinc-700">{meal.totalMacros.kcal.toFixed(0)} kcal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Select Modal */}
      {selectCategory && (
        <ProductSelectModal
          isOpen={selectModalOpen}
          onClose={() => setSelectModalOpen(false)}
          category={selectCategory}
          targetMacro={selectTargetMacro}
          mealType={meal.type}
          onSelect={handleProductSelect}
        />
      )}
    </div>
  );
}
