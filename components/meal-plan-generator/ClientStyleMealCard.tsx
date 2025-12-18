'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Utensils, Leaf, RefreshCw, X, Cherry, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductSelectModal } from './ProductSelectModal';
import { RecipeDetailDialog } from './RecipeDetailDialog';
import { FoodItemDetailDialog } from './FoodItemDetailDialog';
import { RecommendedFoodsDialog } from './RecommendedFoodsDialog';
import { cn } from '@/lib/utils';
import type {
  GeneratedMeal,
  MacroCategory,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS, VEGETABLE_GRAMS } from '@/lib/types/meal-plan-generator';

// Gram input component - updates on blur or Enter
function GramInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (grams: number) => void;
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value.toString());
  const lastSavedValue = useRef(value);

  // Only sync if the external value changed (from another source, not our own update)
  useEffect(() => {
    if (value !== lastSavedValue.current) {
      setLocalValue(value.toString());
      lastSavedValue.current = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleSave = () => {
    const numValue = parseInt(localValue) || 0;
    if (numValue >= 0 && numValue !== lastSavedValue.current) {
      lastSavedValue.current = numValue;
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-14 text-center text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded px-1 py-0.5 focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      min="0"
    />
  );
}

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

interface MealRecipe {
  id: string;
  recipeId: string;
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
  // Recipe management props
  mealRecipes?: MealRecipe[];
  onAddMealRecipe?: (mealIndex: number) => void;
  onRemoveMealRecipe?: (mealIndex: number, recipeId: string) => void;
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
  onUpdateMealMacros,
  disabled = false,
  recipeSuggestions = [],
  onSelectRecipe,
  mealRecipes = [],
  onAddMealRecipe,
  onRemoveMealRecipe,
}: ClientStyleMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Modal state for product selection
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState<MacroCategory | null>(null);
  const [selectTargetMacro, setSelectTargetMacro] = useState(0);
  const [selectDefaultSubcategory, setSelectDefaultSubcategory] = useState<string | undefined>(undefined);

  // Recipe detail dialog state
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // Food item detail dialog state
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodGrams, setSelectedFoodGrams] = useState<number>(100);

  // Recommended foods dialog state
  const [recommendedCategory, setRecommendedCategory] = useState<string | null>(null);

  // Edit target macros dialog state
  const [editTargetOpen, setEditTargetOpen] = useState(false);
  const [editTargetValues, setEditTargetValues] = useState<CalculatedMacros | null>(null);

  // Handle recipe click
  const handleRecipeClick = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setRecipeDialogOpen(true);
  };

  // Handle food item click
  const handleFoodClick = (foodId: string, name: string, grams: number) => {
    setSelectedFoodId(foodId);
    setSelectedFoodName(name);
    setSelectedFoodGrams(grams);
    setFoodDialogOpen(true);
  };

  const mealLabel = mealNumber
    ? `${MEAL_TYPE_LABELS[meal.type]} ${mealNumber}`
    : MEAL_TYPE_LABELS[meal.type];

  // Handle edit target macros
  const handleEditTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meal.targetMacros) {
      setEditTargetValues({ ...meal.targetMacros });
      setEditTargetOpen(true);
    }
  };

  // Save edited target macros
  const handleSaveTarget = async () => {
    if (editTargetValues && onUpdateMealMacros) {
      await onUpdateMealMacros(mealIndex, editTargetValues);
      setEditTargetOpen(false);
      setEditTargetValues(null);
    }
  };

  // Calculate progress percentage
  const targetKcal = meal.targetMacros?.kcal || 0;
  const progressPercent = targetKcal > 0 ? Math.round((meal.totalMacros.kcal / targetKcal) * 100) : 0;

  // Get items by category - separate berries from other carbs
  const proteinItems = meal.items.filter(item => item.category === 'protein');
  const carbItems = meal.items.filter(item => item.category === 'carb' && !isBerry(item.selected.name));
  const berryItems = meal.items.filter(item => item.category === 'carb' && isBerry(item.selected.name));
  const fatItems = meal.items.filter(item => item.category === 'fat');
  const vegetableItems = meal.items.filter(item => item.category === 'vegetable');

  const canHaveSauce = meal.type === 'lunch' || meal.type === 'middag';
  const hasVegetables = meal.vegetableGrams > 0 || vegetableItems.length > 0;

  // Open product select modal
  const handleOpenSelectModal = (category: MacroCategory, targetMacro: number, defaultSubcategory?: string) => {
    setSelectCategory(category);
    setSelectTargetMacro(targetMacro);
    setSelectDefaultSubcategory(defaultSubcategory);
    setSelectModalOpen(true);
  };

  // Handle product selection from modal
  const handleProductSelect = (product: ProductForSelect, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => {
    if (selectCategory && onSelectFood) {
      onSelectFood(mealIndex, selectCategory, product, grams, macros, isAlternative);
    }
    setSelectModalOpen(false);
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

  // Handle direct gram input change
  const handleGramInputChange = (category: MacroCategory, foodId: string, newGrams: number) => {
    if (onUpdateGrams && newGrams >= 0) {
      onUpdateGrams(mealIndex, category, newGrams, foodId);
    }
  };

  // Render a single food item - responsive layout (stacked on mobile, row on desktop)
  const renderFoodItem = (
    item: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros; image?: string | null } },
    category: MacroCategory,
    configKey: string
  ) => {
    const macros = item.selected.macros;

    return (
      <div
        key={item.selected.foodId}
        className="py-2 px-1 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
      >
        {/* Row 1 on mobile: Image + Food name + actions */}
        <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
          {/* Round food image */}
          <button
            onClick={() => handleFoodClick(item.selected.foodId, item.selected.name, item.selected.grams)}
            className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 shrink-0 hover:ring-2 hover:ring-amber-400 transition-all"
          >
            {item.selected.image ? (
              <img
                src={item.selected.image}
                alt={item.selected.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <Utensils className="w-4 h-4" />
              </div>
            )}
          </button>
          <button
            onClick={() => handleFoodClick(item.selected.foodId, item.selected.name, item.selected.grams)}
            className="flex-1 text-left text-sm text-zinc-800 font-medium sm:font-normal truncate hover:text-amber-600 transition-colors"
          >
            {item.selected.name}
          </button>
          {/* Actions - visible on mobile */}
          <div className="flex items-center gap-0.5 shrink-0 sm:hidden">
            <button
              onClick={() => !disabled && handleOpenSelectModal(category, getTargetMacro(category))}
              disabled={disabled}
              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 transition-colors"
              title="Byt"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {onRemoveFood && (
              <button
                onClick={() => !disabled && onRemoveFood(mealIndex, category, item.selected.foodId)}
                disabled={disabled}
                className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                title="Ta bort"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2 on mobile: Gram input + Macros */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gram input - debounced */}
          <GramInput
            value={item.selected.grams}
            onChange={(grams) => handleGramInputChange(category, item.selected.foodId, grams)}
            disabled={disabled}
          />

          {/* Macros */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs tabular-nums flex-1 sm:flex-none">
            <span className="text-red-600 font-medium">{macros.protein.toFixed(1)}g</span>
            <span className="text-blue-600 font-medium">{macros.fat.toFixed(1)}g</span>
            <span className="text-green-600 font-medium">{macros.carbs.toFixed(1)}g</span>
            <span className="text-amber-600 font-medium">{Math.round(macros.kcal)}</span>
          </div>

          {/* Actions - hidden on mobile, visible on desktop */}
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => !disabled && handleOpenSelectModal(category, getTargetMacro(category))}
              disabled={disabled}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 transition-colors"
              title="Byt"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {onRemoveFood && (
              <button
                onClick={() => !disabled && onRemoveFood(mealIndex, category, item.selected.foodId)}
                disabled={disabled}
                className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                title="Ta bort"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a complete category section with header
  const renderCategorySection = (
    items: { category: MacroCategory; selected: { foodId: string; name: string; grams: number; macros: CalculatedMacros; image?: string | null }; isAlternative?: boolean }[],
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
          <button
            onClick={() => setRecommendedCategory(configKey)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="text-base">{config.icon}</span>
            <span className={cn("font-semibold text-sm", config.text)}>{config.label}</span>
          </button>
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

          {/* Right side: Target + Chevron */}
          <div className="flex items-center gap-3">
            {/* Target macros display */}
            {meal.targetMacros && meal.targetMacros.kcal > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="font-medium">Mål:</span>
                <span>{Math.round(meal.targetMacros.kcal)} kcal</span>
                {onUpdateMealMacros && (
                  <button
                    onClick={handleEditTarget}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-amber-600 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
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
                  <button
                    onClick={() => setRecommendedCategory('vegetable')}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-base">{CATEGORY_CONFIG.vegetable.icon}</span>
                    <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.vegetable.text)}>
                      {CATEGORY_CONFIG.vegetable.label}
                    </span>
                  </button>
                  <button
                    onClick={() => !disabled && handleOpenSelectModal('vegetable', 0)}
                    disabled={disabled}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      "bg-white/60 hover:bg-white", CATEGORY_CONFIG.vegetable.text
                    )}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className={cn("p-2", CATEGORY_CONFIG.vegetable.bg)}>
                  {vegetableItems.length > 0 ? (
                    vegetableItems.map(item => renderFoodItem(item, 'vegetable', 'vegetable'))
                  ) : hasVegetables ? (
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
                  <button
                    onClick={() => setRecommendedCategory('berry')}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-base">{CATEGORY_CONFIG.berry.icon}</span>
                    <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.berry.text)}>
                      {CATEGORY_CONFIG.berry.label}
                    </span>
                  </button>
                  <button
                    onClick={() => !disabled && handleOpenSelectModal('carb', 0, 'berry')}
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
                <button
                  onClick={() => setRecommendedCategory('sauce')}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <span className="text-base">{CATEGORY_CONFIG.sauce.icon}</span>
                  <span className={cn("font-semibold text-sm", CATEGORY_CONFIG.sauce.text)}>
                    {CATEGORY_CONFIG.sauce.label}
                  </span>
                </button>
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

          {/* Receptförslag - manuellt hanterade */}
          {onAddMealRecipe && (
            <div className="pt-3 mt-2 border-t border-zinc-200">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Receptförslag
              </div>

              {mealRecipes.length > 0 ? (
                <div className="space-y-2">
                  {mealRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                      onClick={() => handleRecipeClick(recipe.recipeId)}
                    >
                      {/* Recipe image - round */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                        {recipe.image ? (
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Utensils className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Recipe info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-zinc-800 truncate">
                          {recipe.name}
                        </div>
                      </div>

                      {/* Remove button */}
                      {onRemoveMealRecipe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMealRecipe(mealIndex, recipe.id);
                          }}
                          disabled={disabled}
                          className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Ta bort"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Add recipe button */}
              <button
                onClick={() => onAddMealRecipe(mealIndex)}
                disabled={disabled}
                className="w-full mt-2 py-2 px-3 border border-dashed border-zinc-300 rounded-lg text-sm text-zinc-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Lägg till alternativ
              </button>
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
            {/* Progress indicator if target exists */}
            {meal.targetMacros && meal.targetMacros.kcal > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>{progressPercent}% av mål</span>
                  <span>{Math.round(meal.targetMacros.kcal)} kcal</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      progressPercent >= 95 && progressPercent <= 105 ? "bg-green-500" :
                      progressPercent > 105 ? "bg-amber-500" : "bg-amber-400"
                    )}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
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
          defaultSubcategory={selectDefaultSubcategory}
        />
      )}

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipeId={selectedRecipeId}
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
      />

      {/* Food Item Detail Dialog */}
      <FoodItemDetailDialog
        foodId={selectedFoodId}
        foodName={selectedFoodName}
        currentGrams={selectedFoodGrams}
        open={foodDialogOpen}
        onOpenChange={setFoodDialogOpen}
      />

      {/* Recommended Foods Dialog */}
      <RecommendedFoodsDialog
        open={recommendedCategory !== null}
        onOpenChange={(open) => !open && setRecommendedCategory(null)}
        category={recommendedCategory}
      />

      {/* Edit Target Macros Dialog */}
      <Dialog open={editTargetOpen} onOpenChange={setEditTargetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redigera mål - {mealLabel}</DialogTitle>
          </DialogHeader>
          {editTargetValues && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Protein (g)</label>
                  <Input
                    type="number"
                    value={editTargetValues.protein}
                    onChange={(e) => setEditTargetValues({
                      ...editTargetValues,
                      protein: Number(e.target.value),
                      kcal: Number(e.target.value) * 4 + editTargetValues.carbs * 4 + editTargetValues.fat * 9
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Kolhydrater (g)</label>
                  <Input
                    type="number"
                    value={editTargetValues.carbs}
                    onChange={(e) => setEditTargetValues({
                      ...editTargetValues,
                      carbs: Number(e.target.value),
                      kcal: editTargetValues.protein * 4 + Number(e.target.value) * 4 + editTargetValues.fat * 9
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Fett (g)</label>
                  <Input
                    type="number"
                    value={editTargetValues.fat}
                    onChange={(e) => setEditTargetValues({
                      ...editTargetValues,
                      fat: Number(e.target.value),
                      kcal: editTargetValues.protein * 4 + editTargetValues.carbs * 4 + Number(e.target.value) * 9
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Kalorier</label>
                  <Input
                    type="number"
                    value={Math.round(editTargetValues.kcal)}
                    disabled
                    className="mt-1 bg-zinc-50"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Kalorier beräknas automatiskt: P×4 + K×4 + F×9
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditTargetOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTarget}
                  disabled={disabled}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Spara
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
