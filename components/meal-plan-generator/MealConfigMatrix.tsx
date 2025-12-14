'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealConfig, MealType } from '@/lib/types/meal-plan-generator';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal-plan-generator';

interface MealConfigMatrixProps {
  configs: MealConfig[];
  onChange: (configs: MealConfig[]) => void;
  disabled?: boolean;
}

const MEAL_TYPE_ORDER: MealType[] = [
  'frukost',
  'mellanmål',
  'lunch',
  'middag',
  'kvällsmål',
];

export function MealConfigMatrix({
  configs,
  onChange,
  disabled = false,
}: MealConfigMatrixProps) {
  const updateConfig = (index: number, field: keyof MealConfig, value: boolean) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    onChange(newConfigs);
  };

  const addMeal = (type: MealType) => {
    // Find position to insert based on meal type order
    const typeIndex = MEAL_TYPE_ORDER.indexOf(type);
    let insertIndex = configs.length;

    for (let i = 0; i < configs.length; i++) {
      const configTypeIndex = MEAL_TYPE_ORDER.indexOf(configs[i].type);
      if (configTypeIndex > typeIndex) {
        insertIndex = i;
        break;
      }
    }

    const newConfig: MealConfig = {
      type,
      includeProtein: true,
      includeCarbs: type === 'lunch' || type === 'middag' || type === 'frukost',
      includeFat: type !== 'lunch' && type !== 'middag',
    };

    const newConfigs = [
      ...configs.slice(0, insertIndex),
      newConfig,
      ...configs.slice(insertIndex),
    ];
    onChange(newConfigs);
  };

  const removeMeal = (index: number) => {
    const newConfigs = configs.filter((_, i) => i !== index);
    onChange(newConfigs);
  };

  // Count meals by type
  const mealCounts = configs.reduce(
    (acc, config) => {
      acc[config.type] = (acc[config.type] || 0) + 1;
      return acc;
    },
    {} as Record<MealType, number>
  );

  // Generate display label with number if multiple of same type
  const getMealLabel = (config: MealConfig, index: number): string => {
    const sameTypeBefore = configs
      .slice(0, index)
      .filter((c) => c.type === config.type).length;
    const totalOfType = mealCounts[config.type];

    if (totalOfType > 1) {
      return `${MEAL_TYPE_LABELS[config.type]} ${sameTypeBefore + 1}`;
    }
    return MEAL_TYPE_LABELS[config.type];
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Måltid
              </th>
              <th className="text-center py-3 px-4 font-medium text-pink-600">
                Protein
              </th>
              <th className="text-center py-3 px-4 font-medium text-teal-600">
                Kolhydrater
              </th>
              <th className="text-center py-3 px-4 font-medium text-amber-600">
                Fett
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config, index) => (
              <tr
                key={index}
                className={cn(
                  'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                  disabled && 'opacity-50'
                )}
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {getMealLabel(config, index)}
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={config.includeProtein}
                    onCheckedChange={(checked) =>
                      updateConfig(index, 'includeProtein', checked as boolean)
                    }
                    disabled={disabled}
                    className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={config.includeCarbs}
                    onCheckedChange={(checked) =>
                      updateConfig(index, 'includeCarbs', checked as boolean)
                    }
                    disabled={disabled}
                    className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <Checkbox
                    checked={config.includeFat}
                    onCheckedChange={(checked) =>
                      updateConfig(index, 'includeFat', checked as boolean)
                    }
                    disabled={disabled}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </td>
                <td className="py-3 px-4">
                  {configs.length > 1 && !disabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => removeMeal(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 self-center mr-2">
            Lägg till måltid:
          </span>
          {MEAL_TYPE_ORDER.map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addMeal(type)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {MEAL_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
