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
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-amber-600" />
          Måltidsinställningar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal count selector */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Antal måltider:</Label>
          <Select
            value={mealCount.toString()}
            onValueChange={(v) => setMealCount(parseInt(v))}
          >
            <SelectTrigger className="w-20">
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
          <Label className="text-sm font-medium">Fördelningsmetod:</Label>
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
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                  method === opt.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-zinc-700 border border-zinc-300 hover:border-amber-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-meal configuration */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Måltider:</Label>
          <div className="space-y-2">
            {configs.map((config, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-zinc-200 overflow-hidden"
              >
                {/* Meal header - always visible */}
                <button
                  onClick={() => setExpandedMeal(expandedMeal === index ? null : index)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-500 w-5">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium">
                      {MEAL_TYPE_LABELS[config.type]}
                    </span>
                    {method === 'percentage' && (
                      <span className="text-xs text-amber-600 font-medium">
                        {config.percentOfTotal || 0}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Macro flags */}
                    <div className="flex gap-1 text-xs">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        config.includeProtein ? 'bg-rose-100 text-rose-700' : 'bg-zinc-100 text-zinc-400'
                      )}>
                        P
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        config.includeCarbs ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-400'
                      )}>
                        K
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        config.includeFat ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-400'
                      )}>
                        F
                      </span>
                    </div>
                    {expandedMeal === index ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedMeal === index && (
                  <div className="px-3 pb-3 pt-1 border-t border-zinc-100 space-y-3">
                    {/* Meal type */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">Typ:</Label>
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
                    <div className="flex items-center gap-4">
                      <Label className="text-xs w-20">Makros:</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={config.includeProtein}
                            onCheckedChange={(c) => updateConfig(index, { includeProtein: !!c })}
                          />
                          <span className="text-rose-600">Protein</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={config.includeCarbs}
                            onCheckedChange={(c) => updateConfig(index, { includeCarbs: !!c })}
                          />
                          <span className="text-amber-600">Kolhydrater</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={config.includeFat}
                            onCheckedChange={(c) => updateConfig(index, { includeFat: !!c })}
                          />
                          <span className="text-blue-600">Fett</span>
                        </label>
                      </div>
                    </div>

                    {/* Percentage input */}
                    {method === 'percentage' && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-20">Andel:</Label>
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
                        <span className="text-sm text-zinc-500">%</span>
                      </div>
                    )}

                    {/* Fixed macros input */}
                    {method === 'fixed' && (
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs text-rose-600">Protein (g)</Label>
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
                          <Label className="text-xs text-amber-600">Kolhydrater (g)</Label>
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
                          <Label className="text-xs text-blue-600">Fett (g)</Label>
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
                          <Label className="text-xs text-zinc-600">Kcal</Label>
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
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Totalt: {totalPercent}% (bör vara 100%)</span>
          </div>
        )}

        {method === 'fixed' && (
          <div className="text-xs text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg">
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
            className="bg-amber-500 hover:bg-amber-600"
          >
            Tillämpa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
