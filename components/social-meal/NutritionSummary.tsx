'use client';

import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import type { NutritionEstimate, ConfidenceLevel } from '@/lib/social-meal/types';
import { getMacroBreakdown } from '@/lib/social-meal/nutrition-calculator';

interface NutritionSummaryProps {
  nutrition: NutritionEstimate;
  showRange?: boolean;
  compact?: boolean;
  confidence?: ConfidenceLevel;
}

export function NutritionSummary({
  nutrition,
  showRange = false,
  compact = false,
  confidence,
}: NutritionSummaryProps) {
  const breakdown = getMacroBreakdown(nutrition);

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="font-semibold text-gray-900">
          {showRange && nutrition.kcalMin && nutrition.kcalMax
            ? `${nutrition.kcalMin}-${nutrition.kcalMax}`
            : nutrition.kcal}{' '}
          kcal
        </span>
        <span className="text-rose-600">P: {nutrition.protein}g</span>
        <span className="text-amber-600">K: {nutrition.carbs}g</span>
        <span className="text-yellow-600">F: {nutrition.fat}g</span>
      </div>
    );
  }

  const confidenceColors: Record<ConfidenceLevel, string> = {
    low: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-green-100 text-green-700',
  };

  const confidenceLabels: Record<ConfidenceLevel, string> = {
    low: 'Uppskattning',
    medium: 'Bra uppskattning',
    high: 'Säker uppskattning',
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
      {/* Confidence badge */}
      {confidence && (
        <div className="flex justify-center">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
            confidenceColors[confidence]
          )}>
            <Sparkles className="h-3 w-3" />
            {confidenceLabels[confidence]}
          </span>
        </div>
      )}

      {/* Calories */}
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">
          {showRange && nutrition.kcalMin && nutrition.kcalMax
            ? `${nutrition.kcalMin}-${nutrition.kcalMax}`
            : nutrition.kcal}
        </p>
        <p className="text-sm text-gray-500">kcal</p>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <MacroCard
          label="Protein"
          value={nutrition.protein}
          percentage={breakdown.proteinPct}
          color="rose"
        />
        <MacroCard
          label="Kolhydrater"
          value={nutrition.carbs}
          percentage={breakdown.carbsPct}
          color="amber"
        />
        <MacroCard
          label="Fett"
          value={nutrition.fat}
          percentage={breakdown.fatPct}
          color="yellow"
        />
      </div>

      {/* Macro bar */}
      <div className="h-2 rounded-full overflow-hidden flex">
        <div
          className="bg-rose-400"
          style={{ width: `${breakdown.proteinPct}%` }}
        />
        <div
          className="bg-amber-400"
          style={{ width: `${breakdown.carbsPct}%` }}
        />
        <div
          className="bg-yellow-400"
          style={{ width: `${breakdown.fatPct}%` }}
        />
      </div>
    </div>
  );
}

interface MacroCardProps {
  label: string;
  value: number;
  percentage: number;
  color: 'rose' | 'amber' | 'yellow';
}

function MacroCard({ label, value, percentage, color }: MacroCardProps) {
  const colorClasses = {
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className="text-center">
      <p className={cn('text-lg font-bold', colorClasses[color])}>
        {value}g
      </p>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs text-gray-400">{percentage}%</p>
    </div>
  );
}
