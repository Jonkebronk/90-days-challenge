'use client';

import type { CalculatedMacros } from '@/lib/types/meal-plan-generator';
import { cn } from '@/lib/utils';

interface CustomizedMacrosSummaryProps {
  macros: CalculatedMacros;
  targetMacros?: CalculatedMacros;
  linkedCount: number;
  totalCount: number;
  includedCount: number;
}

export function CustomizedMacrosSummary({
  macros,
  targetMacros,
  linkedCount,
  totalCount,
  includedCount,
}: CustomizedMacrosSummaryProps) {
  const isComplete = linkedCount === includedCount && includedCount > 0;
  const progressPercent = includedCount > 0 ? Math.round((linkedCount / includedCount) * 100) : 0;

  // Calculate differences from target
  const getDiff = (actual: number, target: number | undefined) => {
    if (target === undefined) return null;
    return Math.round(actual - target);
  };

  const getDiffColor = (diff: number | null) => {
    if (diff === null) return 'text-zinc-400';
    if (Math.abs(diff) <= 5) return 'text-emerald-600'; // Within 5 is good
    if (diff < 0) return 'text-amber-600'; // Under target
    return 'text-red-500'; // Over target
  };

  const kcalDiff = getDiff(macros.kcal, targetMacros?.kcal);
  const proteinDiff = getDiff(macros.protein, targetMacros?.protein);
  const carbsDiff = getDiff(macros.carbs, targetMacros?.carbs);
  const fatDiff = getDiff(macros.fat, targetMacros?.fat);

  return (
    <div className="bg-zinc-100 rounded-xl p-4 space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600 font-medium">
          {linkedCount} av {includedCount} valda ingredienser länkade
          {includedCount < totalCount && (
            <span className="text-zinc-400 ml-1">
              ({totalCount - includedCount} hoppas över)
            </span>
          )}
        </span>
        <span className="text-xs text-zinc-400">{progressPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Macros summary with target comparison */}
      <div className="pt-2 border-t border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Totalt
          </span>
          {targetMacros && (
            <span className="text-xs text-zinc-400">
              vs Måltidsmål
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Kcal */}
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Kcal</div>
            <div className="text-lg font-bold text-amber-600">{Math.round(macros.kcal)}</div>
            {targetMacros && (
              <div className={cn('text-[10px] font-medium', getDiffColor(kcalDiff))}>
                {kcalDiff !== null && (kcalDiff >= 0 ? `+${kcalDiff}` : kcalDiff)}
                <span className="text-zinc-400 ml-0.5">/ {Math.round(targetMacros.kcal)}</span>
              </div>
            )}
          </div>
          {/* Protein */}
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Protein</div>
            <div className="text-lg font-bold text-rose-600">{Math.round(macros.protein)}g</div>
            {targetMacros && (
              <div className={cn('text-[10px] font-medium', getDiffColor(proteinDiff))}>
                {proteinDiff !== null && (proteinDiff >= 0 ? `+${proteinDiff}` : proteinDiff)}
                <span className="text-zinc-400 ml-0.5">/ {Math.round(targetMacros.protein)}</span>
              </div>
            )}
          </div>
          {/* Kolhydrater */}
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Kolhydr.</div>
            <div className="text-lg font-bold text-amber-500">{Math.round(macros.carbs)}g</div>
            {targetMacros && (
              <div className={cn('text-[10px] font-medium', getDiffColor(carbsDiff))}>
                {carbsDiff !== null && (carbsDiff >= 0 ? `+${carbsDiff}` : carbsDiff)}
                <span className="text-zinc-400 ml-0.5">/ {Math.round(targetMacros.carbs)}</span>
              </div>
            )}
          </div>
          {/* Fett */}
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Fett</div>
            <div className="text-lg font-bold text-sky-500">{Math.round(macros.fat)}g</div>
            {targetMacros && (
              <div className={cn('text-[10px] font-medium', getDiffColor(fatDiff))}>
                {fatDiff !== null && (fatDiff >= 0 ? `+${fatDiff}` : fatDiff)}
                <span className="text-zinc-400 ml-0.5">/ {Math.round(targetMacros.fat)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
