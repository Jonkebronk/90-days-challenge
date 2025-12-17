'use client';

import { useState } from 'react';
import { Check, X, Edit3, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface MealPlanProposal {
  meals: Array<{
    meal_index: number;
    meal_name: string;
    items: Array<{
      food_id?: string;
      food_name: string;
      grams: number;
      category?: string;
    }>;
    macros?: {
      protein: number;
      carbs: number;
      fat: number;
      kcal: number;
    };
  }>;
  total_macros?: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
}

interface NutritionPlanProposal {
  daily_calories: number;
  protein_grams: number;
  carb_grams: number;
  fat_grams: number;
  meals_per_day?: number;
  workout_time?: string;
}

interface ApprovalDialogProps {
  type: 'meal_plan' | 'nutrition_plan';
  summary: string;
  details: MealPlanProposal | NutritionPlanProposal | any;
  onApprove: () => void;
  onReject: () => void;
  onModify: (feedback: string) => void;
  isLoading?: boolean;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function MacroBar({
  label,
  value,
  target,
  unit = 'g',
  color,
}: {
  label: string;
  value: number;
  target?: number;
  unit?: string;
  color: string;
}) {
  const percentage = target ? Math.min((value / target) * 100, 100) : 0;
  const diff = target ? value - target : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200">
          {Math.round(value)}{unit}
          {target && (
            <span className={cn(
              'ml-1',
              Math.abs(diff) <= target * 0.05 ? 'text-green-400' :
              diff > 0 ? 'text-amber-400' : 'text-blue-400'
            )}>
              ({diff > 0 ? '+' : ''}{Math.round(diff)})
            </span>
          )}
        </span>
      </div>
      {target && (
        <div className="h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, index }: { meal: MealPlanProposal['meals'][0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="bg-[#3a3a3a] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#404040] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#e07a5f] font-medium">
            {meal.meal_name || `Maltid ${meal.meal_index + 1}`}
          </span>
          {meal.macros && (
            <span className="text-xs text-gray-400">
              {Math.round(meal.macros.kcal)} kcal
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Food items */}
          <div className="space-y-1">
            {meal.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.food_name}</span>
                <span className="text-gray-400">{item.grams}g</span>
              </div>
            ))}
          </div>

          {/* Meal macros */}
          {meal.macros && (
            <div className="pt-2 border-t border-[#4a4a4a] grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-400">Protein</div>
                <div className="text-gray-200 font-medium">{Math.round(meal.macros.protein)}g</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Kolhydrater</div>
                <div className="text-gray-200 font-medium">{Math.round(meal.macros.carbs)}g</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Fett</div>
                <div className="text-gray-200 font-medium">{Math.round(meal.macros.fat)}g</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Kalorier</div>
                <div className="text-gray-200 font-medium">{Math.round(meal.macros.kcal)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ApprovalDialog({
  type,
  summary,
  details,
  onApprove,
  onReject,
  onModify,
  isLoading = false,
}: ApprovalDialogProps) {
  const [showModify, setShowModify] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleModify = () => {
    if (feedback.trim()) {
      onModify(feedback.trim());
      setFeedback('');
      setShowModify(false);
    }
  };

  const isMealPlan = type === 'meal_plan';
  const mealPlanDetails = isMealPlan ? (details as MealPlanProposal) : null;
  const nutritionPlanDetails = !isMealPlan ? (details as NutritionPlanProposal) : null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Edit3 className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h4 className="font-medium text-amber-400">
            Juni vantar pa ditt godkannande
          </h4>
          <p className="text-sm text-gray-300 mt-1">{summary}</p>
        </div>
      </div>

      {/* Meal Plan Details */}
      {mealPlanDetails?.meals && (
        <div className="space-y-3">
          {/* Total macros */}
          {mealPlanDetails.total_macros && (
            <div className="bg-[#2a2a2a] rounded-lg p-3 space-y-2">
              <h5 className="text-sm font-medium text-gray-200 mb-2">Dagstotaler</h5>
              <MacroBar
                label="Protein"
                value={mealPlanDetails.total_macros.protein}
                color="bg-blue-500"
              />
              <MacroBar
                label="Kolhydrater"
                value={mealPlanDetails.total_macros.carbs}
                color="bg-amber-500"
              />
              <MacroBar
                label="Fett"
                value={mealPlanDetails.total_macros.fat}
                color="bg-purple-500"
              />
              <MacroBar
                label="Kalorier"
                value={mealPlanDetails.total_macros.kcal}
                unit=" kcal"
                color="bg-green-500"
              />
            </div>
          )}

          {/* Meals */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-200">Maltider</h5>
            {mealPlanDetails.meals.map((meal, index) => (
              <MealCard key={index} meal={meal} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Plan Details */}
      {nutritionPlanDetails && (
        <div className="bg-[#2a2a2a] rounded-lg p-3 space-y-3">
          <h5 className="text-sm font-medium text-gray-200">Kostplanens mal</h5>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-[#e07a5f]">
                {Math.round(nutritionPlanDetails.daily_calories)}
              </div>
              <div className="text-xs text-gray-400">kcal/dag</div>
            </div>

            <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(nutritionPlanDetails.protein_grams)}g
              </div>
              <div className="text-xs text-gray-400">protein</div>
            </div>

            <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {Math.round(nutritionPlanDetails.carb_grams)}g
              </div>
              <div className="text-xs text-gray-400">kolhydrater</div>
            </div>

            <div className="bg-[#3a3a3a] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(nutritionPlanDetails.fat_grams)}g
              </div>
              <div className="text-xs text-gray-400">fett</div>
            </div>
          </div>

          {nutritionPlanDetails.meals_per_day && (
            <div className="text-sm text-gray-300">
              <span className="text-gray-400">Maltider per dag:</span>{' '}
              {nutritionPlanDetails.meals_per_day}
            </div>
          )}

          {nutritionPlanDetails.workout_time && (
            <div className="text-sm text-gray-300">
              <span className="text-gray-400">Traningstid:</span>{' '}
              {nutritionPlanDetails.workout_time === 'morning' && 'Morgon'}
              {nutritionPlanDetails.workout_time === 'lunch' && 'Lunch'}
              {nutritionPlanDetails.workout_time === 'afternoon' && 'Eftermiddag'}
              {nutritionPlanDetails.workout_time === 'evening' && 'Kvall'}
            </div>
          )}
        </div>
      )}

      {/* Modify feedback input */}
      {showModify && (
        <div className="space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Beskriv vad du vill andra..."
            className="bg-[#2a2a2a] border-[#4a4a4a] text-gray-200 placeholder:text-gray-500 min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowModify(false);
                setFeedback('');
              }}
              className="text-gray-400 hover:text-gray-200"
            >
              Avbryt
            </Button>
            <Button
              size="sm"
              onClick={handleModify}
              disabled={!feedback.trim()}
              className="bg-[#e07a5f] hover:bg-[#c96a52] text-white"
            >
              Skicka andring
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showModify && (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Godkann
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowModify(true)}
            disabled={isLoading}
            className="flex-1 border-[#4a4a4a] text-gray-300 hover:bg-[#3a3a3a] hover:text-gray-200"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Andra
          </Button>

          <Button
            variant="outline"
            onClick={onReject}
            disabled={isLoading}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
