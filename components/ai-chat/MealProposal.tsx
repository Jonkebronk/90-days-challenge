'use client';

import { useState } from 'react';
import { Check, X, ChevronRight, ChevronDown, Edit2, RefreshCw, Flame, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealItem {
  food_id?: string;
  food_name: string;
  grams: number;
  category?: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface Meal {
  meal_index: number;
  meal_name: string;
  items: MealItem[];
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealProposalProps {
  meals: Meal[];
  totalMacros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targetMacros?: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  summary: string;
  onApprove: () => void;
  onReject: () => void;
  onModifyMeal?: (mealIndex: number, feedback: string) => void;
  onRegenerateMeal?: (mealIndex: number) => void;
  progressiveMode?: boolean;
}

export function MealProposal({
  meals,
  totalMacros,
  targetMacros,
  summary,
  onApprove,
  onReject,
  onModifyMeal,
  onRegenerateMeal,
  progressiveMode = false,
}: MealProposalProps) {
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [approvedMeals, setApprovedMeals] = useState<Set<number>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(
    progressiveMode ? new Set([0]) : new Set(meals.map((_, i) => i))
  );
  const [modifyingMeal, setModifyingMeal] = useState<number | null>(null);
  const [modifyFeedback, setModifyFeedback] = useState('');

  const toggleMealExpanded = (index: number) => {
    const newExpanded = new Set(expandedMeals);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMeals(newExpanded);
  };

  const approveMeal = (index: number) => {
    const newApproved = new Set(approvedMeals);
    newApproved.add(index);
    setApprovedMeals(newApproved);

    // I progressivt läge, gå till nästa måltid
    if (progressiveMode && index < meals.length - 1) {
      setCurrentMealIndex(index + 1);
      const newExpanded = new Set(expandedMeals);
      newExpanded.add(index + 1);
      setExpandedMeals(newExpanded);
    }
  };

  const handleModifySubmit = (mealIndex: number) => {
    if (modifyFeedback.trim() && onModifyMeal) {
      onModifyMeal(mealIndex, modifyFeedback);
      setModifyingMeal(null);
      setModifyFeedback('');
    }
  };

  const allMealsApproved = meals.every((_, i) => approvedMeals.has(i));
  const visibleMeals = progressiveMode
    ? meals.filter((_, i) => i <= currentMealIndex || approvedMeals.has(i))
    : meals;

  const getMacroDeviation = (actual: number, target: number) => {
    const deviation = ((actual - target) / target) * 100;
    return deviation;
  };

  const getDeviationColor = (deviation: number) => {
    const abs = Math.abs(deviation);
    if (abs <= 5) return 'text-green-400';
    if (abs <= 10) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e07a5f]/20 to-[#e07a5f]/5 p-4 border-b border-[#3a3a3a]">
        <h3 className="font-semibold text-gray-100">Förslag på dagsschema</h3>
        <p className="text-sm text-gray-400 mt-1">{summary}</p>
      </div>

      {/* Progress indicator */}
      {progressiveMode && (
        <div className="px-4 py-2 bg-[#333] flex items-center gap-2">
          <span className="text-xs text-gray-500">Progress:</span>
          <div className="flex-1 flex gap-1">
            {meals.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  approvedMeals.has(i)
                    ? 'bg-green-500'
                    : i === currentMealIndex
                    ? 'bg-[#e07a5f]'
                    : 'bg-[#444]'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {approvedMeals.size}/{meals.length}
          </span>
        </div>
      )}

      {/* Meals */}
      <div className="divide-y divide-[#3a3a3a]">
        {visibleMeals.map((meal, index) => {
          const isExpanded = expandedMeals.has(meal.meal_index);
          const isApproved = approvedMeals.has(meal.meal_index);
          const isCurrent = progressiveMode && meal.meal_index === currentMealIndex;

          return (
            <div
              key={meal.meal_index}
              className={cn(
                'transition-colors',
                isApproved && 'bg-green-500/5',
                isCurrent && !isApproved && 'bg-[#e07a5f]/5'
              )}
            >
              {/* Meal header */}
              <button
                onClick={() => toggleMealExpanded(meal.meal_index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#333] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isApproved ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#3a3a3a] flex items-center justify-center text-xs text-gray-400">
                      {meal.meal_index + 1}
                    </div>
                  )}
                  <span className={cn('font-medium', isApproved ? 'text-green-400' : 'text-gray-200')}>
                    {meal.meal_name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Compact macros */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{meal.macros.kcal} kcal</span>
                    <span className="text-blue-400">P{meal.macros.protein}g</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Meal content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {/* Items list */}
                  <div className="space-y-2 mb-3">
                    {meal.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center justify-between py-1.5 px-3 bg-[#333] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              item.category === 'protein'
                                ? 'bg-blue-400'
                                : item.category === 'carb'
                                ? 'bg-amber-400'
                                : item.category === 'fat'
                                ? 'bg-purple-400'
                                : item.category === 'vegetable'
                                ? 'bg-green-400'
                                : 'bg-gray-400'
                            )}
                          />
                          <span className="text-sm text-gray-300">{item.food_name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{item.grams}g</span>
                      </div>
                    ))}
                  </div>

                  {/* Meal macros */}
                  <div className="grid grid-cols-4 gap-2 p-2 bg-[#252525] rounded-lg text-center">
                    <div>
                      <div className="text-sm font-medium text-gray-200">{meal.macros.kcal}</div>
                      <div className="text-xs text-gray-500">kcal</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-400">{meal.macros.protein}g</div>
                      <div className="text-xs text-gray-500">protein</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-amber-400">{meal.macros.carbs}g</div>
                      <div className="text-xs text-gray-500">kolh.</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-purple-400">{meal.macros.fat}g</div>
                      <div className="text-xs text-gray-500">fett</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isApproved && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approveMeal(meal.meal_index)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="h-4 w-4" /> Godkänn
                      </button>
                      {onModifyMeal && (
                        <button
                          onClick={() => setModifyingMeal(meal.meal_index)}
                          className="px-3 py-2 bg-[#3a3a3a] hover:bg-[#404040] text-gray-300 text-sm rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {onRegenerateMeal && (
                        <button
                          onClick={() => onRegenerateMeal(meal.meal_index)}
                          className="px-3 py-2 bg-[#3a3a3a] hover:bg-[#404040] text-gray-300 text-sm rounded-lg transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Modify input */}
                  {modifyingMeal === meal.meal_index && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={modifyFeedback}
                        onChange={(e) => setModifyFeedback(e.target.value)}
                        placeholder="Vad vill du ändra? (t.ex. 'byt kyckling mot lax')"
                        className="w-full px-3 py-2 bg-[#333] border border-[#444] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#e07a5f]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleModifySubmit(meal.meal_index);
                          if (e.key === 'Escape') setModifyingMeal(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModifySubmit(meal.meal_index)}
                          className="flex-1 py-1.5 bg-[#e07a5f] hover:bg-[#c96a52] text-white text-sm rounded-lg"
                        >
                          Skicka
                        </button>
                        <button
                          onClick={() => setModifyingMeal(null)}
                          className="px-3 py-1.5 bg-[#3a3a3a] hover:bg-[#404040] text-gray-400 text-sm rounded-lg"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total summary */}
      <div className="p-4 bg-[#333] border-t border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">Dagstotal</span>
          {targetMacros && (
            <span className="text-xs text-gray-500">Mål inom parentes</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-gray-400" />
              <span className="text-lg font-bold text-gray-200">{totalMacros.kcal}</span>
            </div>
            {targetMacros && (
              <div className={cn('text-xs', getDeviationColor(getMacroDeviation(totalMacros.kcal, targetMacros.kcal)))}>
                ({targetMacros.kcal})
              </div>
            )}
            <div className="text-xs text-gray-500">kcal</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Dumbbell className="h-4 w-4 text-blue-400" />
              <span className="text-lg font-bold text-blue-400">{totalMacros.protein}g</span>
            </div>
            {targetMacros && (
              <div className={cn('text-xs', getDeviationColor(getMacroDeviation(totalMacros.protein, targetMacros.protein)))}>
                ({targetMacros.protein}g)
              </div>
            )}
            <div className="text-xs text-gray-500">protein</div>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-amber-400">{totalMacros.carbs}g</span>
            {targetMacros && (
              <div className={cn('text-xs', getDeviationColor(getMacroDeviation(totalMacros.carbs, targetMacros.carbs)))}>
                ({targetMacros.carbs}g)
              </div>
            )}
            <div className="text-xs text-gray-500">kolh.</div>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-purple-400">{totalMacros.fat}g</span>
            {targetMacros && (
              <div className={cn('text-xs', getDeviationColor(getMacroDeviation(totalMacros.fat, targetMacros.fat)))}>
                ({targetMacros.fat}g)
              </div>
            )}
            <div className="text-xs text-gray-500">fett</div>
          </div>
        </div>
      </div>

      {/* Final actions */}
      <div className="p-4 flex gap-3">
        {allMealsApproved ? (
          <>
            <button
              onClick={onApprove}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              Spara kostschema
            </button>
            <button
              onClick={onReject}
              className="px-4 py-3 bg-[#3a3a3a] hover:bg-[#404040] text-gray-400 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : progressiveMode ? (
          <p className="text-sm text-gray-500 text-center w-full">
            Godkänn alla måltider för att spara schemat
          </p>
        ) : (
          <>
            <button
              onClick={() => {
                // Godkänn alla direkt
                setApprovedMeals(new Set(meals.map((_, i) => i)));
              }}
              className="flex-1 py-3 bg-[#e07a5f] hover:bg-[#c96a52] text-white font-medium rounded-lg transition-colors"
            >
              Godkänn alla
            </button>
            <button
              onClick={onReject}
              className="px-4 py-3 bg-[#3a3a3a] hover:bg-[#404040] text-gray-400 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Avbryt
            </button>
          </>
        )}
      </div>
    </div>
  );
}
