'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MealConfig,
  MealType,
  DistributionMethod,
  MacroTargets,
  CalculatedMacros,
} from '@/lib/types/meal-plan-generator';
import {
  MEAL_TYPE_LABELS,
  generateDefaultMealConfigs,
} from '@/lib/types/meal-plan-generator';

interface MealSettingsEditorProps {
  initialConfigs: MealConfig[];
  initialMethod: DistributionMethod;
  dailyMacros: MacroTargets;
  onApply: (configs: MealConfig[], method: DistributionMethod) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

const MEAL_TYPES: MealType[] = ['frukost', 'mellanmål', 'lunch', 'middag', 'kvällsmål'];

export function MealSettingsEditor({
  initialConfigs,
  initialMethod,
  dailyMacros,
  onApply,
  onCancel,
  isOpen = true,
}: MealSettingsEditorProps) {
  const [mealCount, setMealCount] = useState(initialConfigs.length);
  const [method, setMethod] = useState<DistributionMethod>(initialMethod);
  const [configs, setConfigs] = useState<MealConfig[]>(initialConfigs);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  // Update configs when meal count changes
  useEffect(() => {
    if (mealCount !== configs.length) {
      const newConfigs = generateDefaultMealConfigs(mealCount);
      setConfigs(newConfigs);
    }
  }, [mealCount]);

  // Calculate total percentage
  const totalPercent = configs.reduce((sum, c) => sum + (c.percentOfTotal || 0), 0);
  const percentValid = method !== 'percentage' || (totalPercent >= 99 && totalPercent <= 101);

  // Calculate total fixed macros
  const totalFixedMacros = configs.reduce(
    (sum, c) => ({
      protein: sum.protein + (c.fixedMacros?.protein || 0),
      carbs: sum.carbs + (c.fixedMacros?.carbs || 0),
      fat: sum.fat + (c.fixedMacros?.fat || 0),
      kcal: sum.kcal + (c.fixedMacros?.kcal || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  );

  const updateConfig = (index: number, updates: Partial<MealConfig>) => {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const handleApply = () => {
    onApply(configs, method);
  };

  if (!isOpen) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Måltidsinställningar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Meal count selector */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">Antal måltider:</Label>
          <Select
            value={mealCount.toString()}
            onValueChange={(v) => setMealCount(parseInt(v))}
          >
            <SelectTrigger className="w-16 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distribution method */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Fördelningsmetod:</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'auto', label: 'Automatisk' },
              { value: 'percentage', label: 'Procent' },
              { value: 'fixed', label: 'Exakta gram' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMethod(opt.value as DistributionMethod)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  method === opt.value
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-meal configuration */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Måltider:</Label>
          <div className="space-y-1.5">
            {configs.map((config, index) => (
              <div
                key={index}
                className="rounded-lg border bg-card overflow-hidden"
              >
                {/* Meal header - always visible */}
                <button
                  onClick={() => setExpandedMeal(expandedMeal === index ? null : index)}
                  className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {MEAL_TYPE_LABELS[config.type]}
                    </span>
                    {method === 'percentage' && (
                      <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                        {config.percentOfTotal || 0}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Macro indicators - small colored dots */}
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        config.includeProtein ? 'bg-red-500' : 'bg-muted'
                      )} title="Protein" />
                      <div className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        config.includeCarbs ? 'bg-green-500' : 'bg-muted'
                      )} title="Kolhydrater" />
                      <div className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        config.includeFat ? 'bg-amber-500' : 'bg-muted'
                      )} title="Fett" />
                    </div>
                    <ChevronDown className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      expandedMeal === index && 'rotate-180'
                    )} />
                  </div>
                </button>

                {/* Expanded content */}
                {expandedMeal === index && (
                  <div className="px-3 pb-3 pt-2 border-t space-y-3">
                    {/* Meal type */}
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-16">Typ:</Label>
                      <Select
                        value={config.type}
                        onValueChange={(v) => updateConfig(index, { type: v as MealType })}
                      >
                        <SelectTrigger className="h-8 text-sm flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {MEAL_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Macro checkboxes */}
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-16">Makros:</Label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={config.includeProtein}
                            onCheckedChange={(c) => updateConfig(index, { includeProtein: !!c })}
                          />
                          <span className="text-red-600 text-xs font-medium">Protein</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={config.includeCarbs}
                            onCheckedChange={(c) => updateConfig(index, { includeCarbs: !!c })}
                          />
                          <span className="text-green-600 text-xs font-medium">Kolhydrater</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={config.includeFat}
                            onCheckedChange={(c) => updateConfig(index, { includeFat: !!c })}
                          />
                          <span className="text-amber-600 text-xs font-medium">Fett</span>
                        </label>
                      </div>
                    </div>

                    {/* Percentage input */}
                    {method === 'percentage' && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-16">Andel:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={config.percentOfTotal || 0}
                            onChange={(e) =>
                              updateConfig(index, { percentOfTotal: parseInt(e.target.value) || 0 })
                            }
                            className="h-8 w-20 text-sm"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    )}

                    {/* Fixed macros input */}
                    {method === 'fixed' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs text-red-600">Protein (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={config.fixedMacros?.protein || 0}
                            onChange={(e) =>
                              updateConfig(index, {
                                fixedMacros: {
                                  ...(config.fixedMacros || { protein: 0, carbs: 0, fat: 0, kcal: 0 }),
                                  protein: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-green-600">Kolhydrater (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={config.fixedMacros?.carbs || 0}
                            onChange={(e) =>
                              updateConfig(index, {
                                fixedMacros: {
                                  ...(config.fixedMacros || { protein: 0, carbs: 0, fat: 0, kcal: 0 }),
                                  carbs: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-amber-600">Fett (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={config.fixedMacros?.fat || 0}
                            onChange={(e) =>
                              updateConfig(index, {
                                fixedMacros: {
                                  ...(config.fixedMacros || { protein: 0, carbs: 0, fat: 0, kcal: 0 }),
                                  fat: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Kcal</Label>
                          <Input
                            type="number"
                            min={0}
                            value={config.fixedMacros?.kcal || 0}
                            onChange={(e) =>
                              updateConfig(index, {
                                fixedMacros: {
                                  ...(config.fixedMacros || { protein: 0, carbs: 0, fat: 0, kcal: 0 }),
                                  kcal: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Validation messages */}
        {method === 'percentage' && !percentValid && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Totalt: {totalPercent}% (bör vara 100%)</span>
          </div>
        )}

        {method === 'fixed' && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg space-y-1">
            <div>Dagsmål: {dailyMacros.protein}g P / {dailyMacros.carbs}g K / {dailyMacros.fat}g F / {dailyMacros.kcal} kcal</div>
            <div>
              Inställt:{' '}
              <span className={totalFixedMacros.protein !== dailyMacros.protein ? 'text-amber-600' : ''}>
                {totalFixedMacros.protein}g P
              </span>{' / '}
              <span className={totalFixedMacros.carbs !== dailyMacros.carbs ? 'text-amber-600' : ''}>
                {totalFixedMacros.carbs}g K
              </span>{' / '}
              <span className={totalFixedMacros.fat !== dailyMacros.fat ? 'text-amber-600' : ''}>
                {totalFixedMacros.fat}g F
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Avbryt
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!percentValid}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Tillämpa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
