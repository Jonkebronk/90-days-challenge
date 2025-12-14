'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MacroProgressBar } from './MacroProgressBar';
import type { MacroTargets } from '@/lib/types/meal-plan-generator';

interface MacroSummaryProps {
  targetMacros: MacroTargets;
  actualMacros: MacroTargets;
  title?: string;
}

export function MacroSummary({
  targetMacros,
  actualMacros,
  title = 'Makroöversikt',
}: MacroSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MacroProgressBar
          label="Protein"
          target={targetMacros.protein}
          actual={actualMacros.protein}
          unit="g"
          color="protein"
        />
        <MacroProgressBar
          label="Kolhydrater"
          target={targetMacros.carbs}
          actual={actualMacros.carbs}
          unit="g"
          color="carbs"
        />
        <MacroProgressBar
          label="Fett"
          target={targetMacros.fat}
          actual={actualMacros.fat}
          unit="g"
          color="fat"
        />
        <MacroProgressBar
          label="Kalorier"
          target={targetMacros.kcal}
          actual={actualMacros.kcal}
          unit="kcal"
          color="kcal"
        />
      </CardContent>
    </Card>
  );
}
