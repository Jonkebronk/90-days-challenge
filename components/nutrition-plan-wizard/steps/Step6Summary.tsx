'use client';

import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import {
  METABOLISM_ACTIVITY_LABELS,
  METABOLISM_MULTIPLIERS,
  FAT_LOSS_RATE_CONFIG,
} from '@/lib/types/client-nutrition-plan';

export function Step6Summary() {
  const {
    clientName,
    weight,
    metabolismActivityLevel,
    fatLossRate,
    proteinPerKg,
    fatPerKg,
    nextStep,
    previousStep,
  } = useNutritionPlanWizardStore();

  // Calculate values directly to ensure consistency
  const multiplier = metabolismActivityLevel ? METABOLISM_MULTIPLIERS[metabolismActivityLevel] : 30;
  const metabolism = weight * multiplier; // Calculate directly, don't use tdee from store
  const deficit = fatLossRate ? FAT_LOSS_RATE_CONFIG[fatLossRate].deficitPerDay : 0;
  const fatLossLabel = fatLossRate ? FAT_LOSS_RATE_CONFIG[fatLossRate].label : '';
  const activityLabel = metabolismActivityLevel ? METABOLISM_ACTIVITY_LABELS[metabolismActivityLevel] : '';

  // Calculate calorie target directly (metabolism - deficit)
  const actualCalorieTarget = Math.round(Math.max(1200, metabolism - deficit));

  // Calculate macros based on the correct calorie target
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;
  const fatGrams = Math.round(weight * fatPerKg);
  const fatCalories = fatGrams * 9;
  const remainingCalories = actualCalorieTarget - proteinCalories - fatCalories;
  const carbGrams = Math.round(Math.max(0, remainingCalories / 4));
  const carbCalories = carbGrams * 4;
  const totalCalories = proteinCalories + fatCalories + carbCalories;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Sammanställning
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Komplett beräkningsöversikt
        </p>
      </div>

      {/* Client info */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <strong>Klient:</strong> {clientName || 'Ej vald'}, {weight} kg, {activityLabel.toLowerCase()}, vill tappa {fatLossLabel}
      </div>

      {/* Step 1 - Metabolism */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Steg 1 – Ämnesomsättning</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
          {weight} kg × {multiplier} = {metabolism.toLocaleString('sv-SE')} kcal/dag
        </div>
      </div>

      {/* Step 2 - Calorie intake */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Steg 2 – Kaloriintag</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
          {metabolism.toLocaleString('sv-SE')} kcal - {deficit} kcal = {actualCalorieTarget.toLocaleString('sv-SE')} kcal/dag
        </div>
      </div>

      {/* Step 3 - Protein */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Steg 3 – Protein</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 space-y-1">
          <div>{weight} kg × {proteinPerKg} = {proteinGrams}g protein/dag</div>
          <div>{proteinGrams}g × 4 kcal = {proteinCalories} kcal från protein</div>
        </div>
      </div>

      {/* Step 4 - Fat */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Steg 4 – Fett</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 space-y-1">
          <div>{weight} kg × {fatPerKg} = {fatGrams}g fett/dag</div>
          <div>{fatGrams}g × 9 kcal = {fatCalories} kcal från fett</div>
        </div>
      </div>

      {/* Step 5 - Carbs */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900">Steg 5 – Kolhydrater</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 space-y-1">
          <div>{actualCalorieTarget.toLocaleString('sv-SE')} kcal - {proteinCalories} kcal - {fatCalories} kcal = {remainingCalories} kcal kvar</div>
          <div>{remainingCalories} kcal ÷ 4 = {carbGrams}g kolhydrater/dag</div>
        </div>
      </div>

      {/* Result table */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Resultat</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">Makro</th>
                <th className="text-left p-3 font-medium text-gray-700">Gram</th>
                <th className="text-left p-3 font-medium text-gray-700">Kcal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 text-gray-600">Protein</td>
                <td className="p-3">{proteinGrams}g</td>
                <td className="p-3">{proteinCalories}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 text-gray-600">Fett</td>
                <td className="p-3">{fatGrams}g</td>
                <td className="p-3">{fatCalories}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 text-gray-600">Kolhydrater</td>
                <td className="p-3">{carbGrams}g</td>
                <td className="p-3">{carbCalories}</td>
              </tr>
              <tr className="border-t border-gray-200 bg-amber-50">
                <td className="p-3 font-semibold text-gray-900">Totalt</td>
                <td className="p-3">-</td>
                <td className="p-3 font-semibold text-amber-700">{totalCalories.toLocaleString('sv-SE')} kcal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <WizardNavigation
        onBack={previousStep}
        onNext={nextStep}
      />
    </div>
  );
}
