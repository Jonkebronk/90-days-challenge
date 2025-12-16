/**
 * Virtual Nutritionist - Validering av kostscheman
 *
 * Validerar:
 * - Makrofördelning (protein, kolhydrater, fett)
 * - Mikronutrienter mot RDI
 * - Coach-regler (undvikna livsmedel, allergier)
 */

import {
  ValidationResult,
  GeneratedMeal,
  CoachAISettingsInput,
  RDI,
  RDI_MAN,
  RDI_KVINNA,
  MicronutrientIntake,
  MicronutrientStatus,
  SlvFoodForPrompt,
} from './types';

interface ValidationContext {
  weight: number;
  gender: 'male' | 'female';
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  settings: CoachAISettingsInput;
  allergies?: string;
}

/**
 * Validerar ett komplett kostschema
 */
export function validateMealPlan(
  meals: GeneratedMeal[],
  context: ValidationContext
): ValidationResult {
  const problem: string[] = [];
  const suggestions: string[] = [];

  // 1. Validera totalt protein
  const totalProtein = meals.reduce((sum, m) => sum + m.actualMacros.protein, 0);
  const proteinPerKg = totalProtein / context.weight;

  if (proteinPerKg < context.settings.proteinMinPerKg) {
    problem.push(
      `Protein för lågt: ${proteinPerKg.toFixed(1)}g/kg (min ${context.settings.proteinMinPerKg}g/kg)`
    );
    suggestions.push('Lägg till mer proteinkälla eller öka portionsstorleken');
  }

  if (proteinPerKg > context.settings.proteinMaxPerKg) {
    problem.push(
      `Protein för högt: ${proteinPerKg.toFixed(1)}g/kg (max ${context.settings.proteinMaxPerKg}g/kg)`
    );
    suggestions.push('Minska proteinkällorna något');
  }

  // 2. Validera jämn proteinfördelning
  const proteinPerMeal = meals.map(m => m.actualMacros.protein);
  const avgProtein = totalProtein / meals.length;
  const unevenMeals = proteinPerMeal.filter(
    p => Math.abs(p - avgProtein) > avgProtein * 0.3
  );

  if (unevenMeals.length > 1) {
    problem.push('Protein ojämnt fördelat mellan måltider');
    suggestions.push(
      'Justera portionerna för jämnare proteinfördelning (0.4-0.55g/kg per måltid)'
    );
  }

  // 3. Validera totala kalorier (±5%)
  const totalKcal = meals.reduce((sum, m) => sum + m.actualMacros.kcal, 0);
  const kcalDiff = Math.abs(totalKcal - context.dailyCalorieTarget);
  const kcalDiffPercent = (kcalDiff / context.dailyCalorieTarget) * 100;

  if (kcalDiffPercent > 5) {
    problem.push(
      `Kalorier avviker ${kcalDiff.toFixed(0)}kcal (${kcalDiffPercent.toFixed(1)}%) från målet`
    );
    if (totalKcal > context.dailyCalorieTarget) {
      suggestions.push('Minska portionsstorlekarna eller välj magrare alternativ');
    } else {
      suggestions.push('Öka portionsstorlekarna eller lägg till mellanmål');
    }
  }

  // 4. Validera kolhydrater (±10%)
  const totalCarbs = meals.reduce((sum, m) => sum + m.actualMacros.carbs, 0);
  const carbsDiff = Math.abs(totalCarbs - context.carbGrams);
  if (carbsDiff > context.carbGrams * 0.1) {
    problem.push(
      `Kolhydrater avviker ${carbsDiff.toFixed(0)}g från målet (${context.carbGrams}g)`
    );
  }

  // 5. Validera fett (±10%)
  const totalFat = meals.reduce((sum, m) => sum + m.actualMacros.fat, 0);
  const fatPerKg = totalFat / context.weight;

  if (fatPerKg < context.settings.fettMinPerKg) {
    problem.push(
      `Fett för lågt: ${fatPerKg.toFixed(2)}g/kg (min ${context.settings.fettMinPerKg}g/kg)`
    );
    suggestions.push('Lägg till hälsosamma fetter som nötter, olivolja eller avokado');
  }

  // 6. Kontrollera undvikna livsmedel
  const usedFoods = meals.flatMap(m => m.items.map(i => i.foodName.toLowerCase()));
  const forbidden = context.settings.undviknaLivsmedel.filter(u =>
    usedFoods.some(f => f.includes(u.toLowerCase()))
  );

  if (forbidden.length > 0) {
    problem.push(`Innehåller undvikna livsmedel: ${forbidden.join(', ')}`);
    suggestions.push('Byt ut dessa mot godkända alternativ');
  }

  // 7. Kontrollera allergier
  if (context.allergies) {
    const allergyList = context.allergies.toLowerCase().split(',').map(a => a.trim());
    const allergyMatches = allergyList.filter(allergy =>
      usedFoods.some(f => f.includes(allergy))
    );

    if (allergyMatches.length > 0) {
      problem.push(`VARNING: Möjliga allergener: ${allergyMatches.join(', ')}`);
      suggestions.push('Verifiera att produkterna är säkra för klienten');
    }
  }

  return {
    godkant: problem.length === 0,
    problem,
    suggestions,
  };
}

/**
 * Validerar mikronutrienter mot RDI
 */
export function validateMicronutrients(
  intake: MicronutrientIntake,
  gender: 'male' | 'female'
): MicronutrientStatus[] {
  const rdi = gender === 'male' ? RDI_MAN : RDI_KVINNA;
  const statuses: MicronutrientStatus[] = [];

  const nutrients: {
    key: keyof MicronutrientIntake;
    name: string;
    unit: string;
  }[] = [
    { key: 'vitaminA', name: 'Vitamin A', unit: 'µg' },
    { key: 'vitaminD', name: 'Vitamin D', unit: 'µg' },
    { key: 'vitaminC', name: 'Vitamin C', unit: 'mg' },
    { key: 'vitaminB12', name: 'Vitamin B12', unit: 'µg' },
    { key: 'folate', name: 'Folat', unit: 'µg' },
    { key: 'calcium', name: 'Kalcium', unit: 'mg' },
    { key: 'iron', name: 'Järn', unit: 'mg' },
    { key: 'magnesium', name: 'Magnesium', unit: 'mg' },
    { key: 'potassium', name: 'Kalium', unit: 'mg' },
    { key: 'zinc', name: 'Zink', unit: 'mg' },
    { key: 'iodine', name: 'Jod', unit: 'µg' },
  ];

  for (const nutrient of nutrients) {
    const value = intake[nutrient.key];
    const rdiValue = rdi[nutrient.key];
    const percentOfRdi = (value / rdiValue) * 100;

    let status: 'low' | 'ok' | 'high';
    if (percentOfRdi < 80) {
      status = 'low';
    } else if (percentOfRdi > 200) {
      status = 'high';
    } else {
      status = 'ok';
    }

    statuses.push({
      name: nutrient.name,
      intake: value,
      rdi: rdiValue,
      unit: nutrient.unit,
      percentOfRdi: Math.round(percentOfRdi),
      status,
    });
  }

  return statuses;
}

/**
 * Beräknar totala mikronutrienter från SLV-livsmedel
 */
export function calculateMicronutrients(
  foods: { slvFood: SlvFoodForPrompt; grams: number }[]
): MicronutrientIntake {
  const intake: MicronutrientIntake = {
    vitaminA: 0,
    vitaminD: 0,
    vitaminC: 0,
    vitaminB12: 0,
    folate: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    potassium: 0,
    zinc: 0,
    iodine: 0,
  };

  for (const { slvFood, grams } of foods) {
    const factor = grams / 100;

    intake.vitaminA += (slvFood.vitaminA ?? 0) * factor;
    intake.vitaminD += (slvFood.vitaminD ?? 0) * factor;
    intake.vitaminC += (slvFood.vitaminC ?? 0) * factor;
    intake.vitaminB12 += (slvFood.vitaminB12 ?? 0) * factor;
    intake.folate += (slvFood.folate ?? 0) * factor;
    intake.calcium += (slvFood.calcium ?? 0) * factor;
    intake.iron += (slvFood.iron ?? 0) * factor;
    intake.magnesium += (slvFood.magnesium ?? 0) * factor;
    intake.potassium += (slvFood.potassium ?? 0) * factor;
    intake.zinc += (slvFood.zinc ?? 0) * factor;
    intake.iodine += (slvFood.iodine ?? 0) * factor;
  }

  return intake;
}

/**
 * Genererar rekommendationer baserat på mikronutrientbrister
 */
export function getMicronutrientRecommendations(
  statuses: MicronutrientStatus[]
): string[] {
  const recommendations: string[] = [];

  const lowNutrients = statuses.filter(s => s.status === 'low');

  for (const nutrient of lowNutrients) {
    switch (nutrient.name) {
      case 'Järn':
        recommendations.push(
          `Järnintaget är ${nutrient.percentOfRdi}% av RDI - Lägg till 100g spenat eller 150g nötfärs`
        );
        break;
      case 'Kalcium':
        recommendations.push(
          `Kalcium är ${nutrient.percentOfRdi}% av RDI - Lägg till 100g kvarg eller 200ml mjölk`
        );
        break;
      case 'Vitamin D':
        recommendations.push(
          `Vitamin D är ${nutrient.percentOfRdi}% av RDI - Överväg fet fisk 2x/vecka (lax, makrill)`
        );
        break;
      case 'Vitamin B12':
        recommendations.push(
          `B12 är ${nutrient.percentOfRdi}% av RDI - Säkerställ animaliska proteinkällor dagligen`
        );
        break;
      case 'Folat':
        recommendations.push(
          `Folat är ${nutrient.percentOfRdi}% av RDI - Öka spenat till 120g eller lägg till baljväxter`
        );
        break;
      case 'Magnesium':
        recommendations.push(
          `Magnesium är ${nutrient.percentOfRdi}% av RDI - Lägg till nötter, frön eller fullkorn`
        );
        break;
      case 'Zink':
        recommendations.push(
          `Zink är ${nutrient.percentOfRdi}% av RDI - Nötkött, ost eller pumpakärnor kan hjälpa`
        );
        break;
      case 'Jod':
        recommendations.push(
          `Jod är ${nutrient.percentOfRdi}% av RDI - Använd jodsalt eller ät fisk/skaldjur`
        );
        break;
    }
  }

  return recommendations;
}

/**
 * Formaterar validationsresultat för visning
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.godkant) {
    return '✅ Kostschemat är godkänt!';
  }

  let output = '⚠️ VALIDERING MISSLYCKADES\n\n';

  if (result.problem.length > 0) {
    output += 'Problem:\n';
    output += result.problem.map(p => `• ${p}`).join('\n');
    output += '\n\n';
  }

  if (result.suggestions.length > 0) {
    output += 'Förslag:\n';
    output += result.suggestions.map(s => `• ${s}`).join('\n');
  }

  return output;
}

/**
 * Formaterar mikronutrient-status för visning
 */
export function formatMicronutrientStatus(statuses: MicronutrientStatus[]): string {
  const lines: string[] = ['📊 MIKRONUTRIENT-ÖVERSIKT\n'];

  // Gruppera efter status
  const low = statuses.filter(s => s.status === 'low');
  const ok = statuses.filter(s => s.status === 'ok');
  const high = statuses.filter(s => s.status === 'high');

  if (low.length > 0) {
    lines.push('⚠️ Lågt intag:');
    for (const s of low) {
      lines.push(
        `  ${s.name}: ${s.intake.toFixed(1)}${s.unit} (${s.percentOfRdi}% av RDI)`
      );
    }
    lines.push('');
  }

  if (ok.length > 0) {
    lines.push('✅ OK:');
    for (const s of ok) {
      lines.push(
        `  ${s.name}: ${s.intake.toFixed(1)}${s.unit} (${s.percentOfRdi}% av RDI)`
      );
    }
    lines.push('');
  }

  if (high.length > 0) {
    lines.push('⬆️ Högt intag:');
    for (const s of high) {
      lines.push(
        `  ${s.name}: ${s.intake.toFixed(1)}${s.unit} (${s.percentOfRdi}% av RDI)`
      );
    }
  }

  return lines.join('\n');
}
