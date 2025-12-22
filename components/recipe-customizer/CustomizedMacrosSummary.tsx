'use client';

import type { CalculatedMacros } from '@/lib/types/meal-plan-generator';

interface CustomizedMacrosSummaryProps {
  macros: CalculatedMacros;
  linkedCount: number;
  totalCount: number;
}

export function CustomizedMacrosSummary({
  macros,
  linkedCount,
  totalCount,
}: CustomizedMacrosSummaryProps) {
  const isComplete = linkedCount === totalCount && totalCount > 0;
  const progressPercent = totalCount > 0 ? Math.round((linkedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-zinc-100 rounded-xl p-4 space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600 font-medium">
          {linkedCount} av {totalCount} ingredienser länkade
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

      {/* Macros summary */}
      <div className="pt-2 border-t border-zinc-200">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Totalt (länkade ingredienser)
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Kcal</div>
            <div className="text-lg font-bold text-amber-600">{Math.round(macros.kcal)}</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Protein</div>
            <div className="text-lg font-bold text-rose-600">{Math.round(macros.protein)}g</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Kolhydrater</div>
            <div className="text-lg font-bold text-amber-500">{Math.round(macros.carbs)}g</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[10px] text-zinc-400 uppercase font-medium">Fett</div>
            <div className="text-lg font-bold text-sky-500">{Math.round(macros.fat)}g</div>
          </div>
        </div>
      </div>
    </div>
  );
}
