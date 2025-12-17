/**
 * Juni AI Agent - Tool Executor
 *
 * Exekverar tools som Juni anropar och returnerar resultat.
 * Hanterar:
 * - Sökning i SLV och Product-databaser
 * - Makroberäkningar
 * - Validering av kostplaner
 * - Sparande av data (med approval-krav)
 * - Klientminne
 */

import { prisma } from '@/lib/prisma';
import type { JuniToolName, ToolResult } from './tools';
import { loadSlvData, type SlvFood } from './slv-loader';

// =============================================================================
// MAIN EXECUTOR
// =============================================================================

export async function executeJuniTool(
  name: JuniToolName,
  input: Record<string, any>,
  context?: { nutritionPlanId?: string; clientId?: string; coachId?: string }
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'search_foods':
        return await searchFoods(input.query, input.category, input.max_results);

      case 'calculate_macros':
        return await calculateMacros(input.items);

      case 'validate_meal_plan':
        return await validateMealPlan(
          input.meals,
          input.target_macros,
          input.client_weight_kg,
          input.allergies
        );

      case 'propose_meal_plan':
        return proposeMealPlan(input.meals, input.summary, input.total_macros);

      case 'save_meal_plan':
        return await saveMealPlan(input.nutrition_plan_id, input.meals);

      case 'get_client_info':
        return await getClientInfo(input.client_id, input.nutrition_plan_id, context);

      case 'update_client_memory':
        return await updateClientMemory(input.client_id, input.preference_type, input.content);

      case 'search_recipes':
        return await searchRecipes(
          input.query,
          input.meal_type,
          input.dietary_tags,
          input.max_calories,
          input.min_protein,
          input.max_results
        );

      case 'suggest_recipes_for_meal':
        return await suggestRecipesForMeal(
          input.meal_index,
          input.target_macros,
          input.meal_type,
          input.exclude_ingredients
        );

      case 'get_recipe_details':
        return await getRecipeDetails(input.recipe_id);

      case 'calculate_bmr_tdee':
        return calculateBmrTdee(input as Parameters<typeof calculateBmrTdee>[0]);

      case 'calculate_macro_targets':
        return calculateMacroTargets(input as Parameters<typeof calculateMacroTargets>[0]);

      case 'create_nutrition_plan':
        return proposeNutritionPlan(input);

      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// =============================================================================
// SEARCH FOODS
// =============================================================================

async function searchFoods(
  query: string,
  category?: string,
  maxResults: number = 10
): Promise<ToolResult> {
  const results: Array<{
    id: string;
    name: string;
    source: 'slv' | 'product';
    category?: string;
    per100g: {
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
  }> = [];

  // 1. Sök i SLV-databasen
  const slvData = await loadSlvData();
  const queryLower = query.toLowerCase();

  for (const [catName, foods] of Object.entries(slvData.categories)) {
    // Filtrera på kategori om angiven
    if (category && category !== 'all') {
      const categoryMap: Record<string, string[]> = {
        protein: ['Fågel', 'Kött', 'Fisk', 'Skaldjur', 'kvarg', 'Baljväxter'],
        carbs: ['Ris', 'Pasta', 'Gryn', 'Potatis', 'Frukt', 'Bröd'],
        fat: ['Ägg', 'Ost', 'Olja', 'Nöt', 'Smör'],
        vegetables: ['Grönsak', 'Bladgrönt', 'Lök', 'Svamp'],
        berries: ['Bär'],
        dairy: ['Mjölk', 'Yoghurt', 'Fil', 'Grädde']
      };

      const allowedCats = categoryMap[category] || [];
      if (!allowedCats.some(c => catName.toLowerCase().includes(c.toLowerCase()))) {
        continue;
      }
    }

    for (const food of foods as SlvFood[]) {
      if (food.namn.toLowerCase().includes(queryLower)) {
        results.push({
          id: food.nummer.toString(),
          name: food.namn,
          source: 'slv',
          category: catName,
          per100g: {
            kcal: food.kcal || 0,
            protein: food.protein || 0,
            carbs: food.kolhydrater || 0,
            fat: food.fett || 0,
            fiber: food.fiber || 0
          }
        });
      }
    }
  }

  // 2. Sök i Product-databasen (fallback)
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    take: 20
  });

  for (const product of products) {
    // Undvik dubletter
    if (!results.some(r => r.name.toLowerCase() === product.name.toLowerCase())) {
      results.push({
        id: `product_${product.id}`,
        name: product.name,
        source: 'product',
        category: product.category || undefined,
        per100g: {
          kcal: toNum(product.kcal),
          protein: toNum(product.protein),
          carbs: toNum(product.carbs),
          fat: toNum(product.fat),
          fiber: toNum(product.fiber)
        }
      });
    }
  }

  // Sortera efter relevans (exakt match först)
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === queryLower ? 0 : 1;
    const bExact = b.name.toLowerCase() === queryLower ? 0 : 1;
    return aExact - bExact;
  });

  return {
    success: true,
    data: {
      query,
      results: results.slice(0, Math.min(maxResults, 50)),
      total_found: results.length
    }
  };
}

// =============================================================================
// CALCULATE MACROS
// =============================================================================

async function calculateMacros(
  items: Array<{ food_id?: string; food_name?: string; grams: number }>
): Promise<ToolResult> {
  const slvData = await loadSlvData();
  const calculated: Array<{
    food_name: string;
    grams: number;
    macros: { protein: number; carbs: number; fat: number; kcal: number };
  }> = [];

  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalKcal = 0;

  for (const item of items) {
    let food: SlvFood | null = null;

    // Försök hitta i SLV via ID
    if (item.food_id && !item.food_id.startsWith('product_')) {
      for (const foods of Object.values(slvData.categories)) {
        const found = (foods as SlvFood[]).find(f => f.nummer.toString() === item.food_id);
        if (found) {
          food = found;
          break;
        }
      }
    }

    // Fallback: sök på namn
    if (!food && item.food_name) {
      const nameLower = item.food_name.toLowerCase();
      for (const foods of Object.values(slvData.categories)) {
        const found = (foods as SlvFood[]).find(f =>
          f.namn.toLowerCase().includes(nameLower) ||
          nameLower.includes(f.namn.toLowerCase())
        );
        if (found) {
          food = found;
          break;
        }
      }
    }

    if (food) {
      const factor = item.grams / 100;
      const macros = {
        protein: Math.round((food.protein || 0) * factor * 10) / 10,
        carbs: Math.round((food.kolhydrater || 0) * factor * 10) / 10,
        fat: Math.round((food.fett || 0) * factor * 10) / 10,
        kcal: Math.round((food.kcal || 0) * factor)
      };

      calculated.push({
        food_name: food.namn,
        grams: item.grams,
        macros
      });

      totalProtein += macros.protein;
      totalCarbs += macros.carbs;
      totalFat += macros.fat;
      totalKcal += macros.kcal;
    } else {
      // Om vi inte hittar, lägg till som okänt
      calculated.push({
        food_name: item.food_name || item.food_id || 'Okänt',
        grams: item.grams,
        macros: { protein: 0, carbs: 0, fat: 0, kcal: 0 }
      });
    }
  }

  return {
    success: true,
    data: {
      items: calculated,
      totals: {
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        kcal: Math.round(totalKcal)
      }
    }
  };
}

// =============================================================================
// VALIDATE MEAL PLAN
// =============================================================================

async function validateMealPlan(
  meals: any[],
  targetMacros: { protein: number; carbs: number; fat: number; kcal: number },
  clientWeightKg?: number,
  allergies?: string[]
): Promise<ToolResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Beräkna totaler
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalKcal = 0;

  const mealProteins: number[] = [];

  for (const meal of meals) {
    const mealProtein = meal.macros?.protein || 0;
    totalProtein += mealProtein;
    totalCarbs += meal.macros?.carbs || 0;
    totalFat += meal.macros?.fat || 0;
    totalKcal += meal.macros?.kcal || 0;
    mealProteins.push(mealProtein);
  }

  // 1. Validera protein
  if (clientWeightKg) {
    const proteinPerKg = totalProtein / clientWeightKg;
    if (proteinPerKg < 1.6) {
      issues.push(`Protein för lågt: ${proteinPerKg.toFixed(1)}g/kg (minimum 1.6g/kg)`);
      suggestions.push('Öka proteinkällorna eller portionsstorlekarna');
    } else if (proteinPerKg > 2.5) {
      issues.push(`Protein för högt: ${proteinPerKg.toFixed(1)}g/kg (max 2.5g/kg)`);
    }
  }

  // 2. Validera proteinfördelning
  if (mealProteins.length > 1) {
    const avgProtein = totalProtein / mealProteins.length;
    const unevenMeals = mealProteins.filter(p => Math.abs(p - avgProtein) > avgProtein * 0.4);
    if (unevenMeals.length > 0) {
      issues.push('Proteinet är ojämnt fördelat mellan måltiderna');
      suggestions.push('Fördela protein jämnare (0.4-0.55g/kg per måltid för optimal proteinsyntés)');
    }
  }

  // 3. Validera kalorier (±5%)
  const kcalDiff = Math.abs(totalKcal - targetMacros.kcal);
  const kcalDiffPercent = (kcalDiff / targetMacros.kcal) * 100;
  if (kcalDiffPercent > 5) {
    const direction = totalKcal > targetMacros.kcal ? 'över' : 'under';
    issues.push(`Kalorier ${direction} målet: ${totalKcal} vs ${targetMacros.kcal} kcal (${kcalDiffPercent.toFixed(0)}% avvikelse)`);
  }

  // 4. Validera kolhydrater (±10%)
  const carbsDiff = Math.abs(totalCarbs - targetMacros.carbs);
  const carbsDiffPercent = (carbsDiff / targetMacros.carbs) * 100;
  if (carbsDiffPercent > 10) {
    issues.push(`Kolhydrater avviker: ${totalCarbs}g vs ${targetMacros.carbs}g mål`);
  }

  // 5. Validera fett
  if (clientWeightKg && (totalFat / clientWeightKg) < 0.7) {
    issues.push(`Fett för lågt: ${(totalFat / clientWeightKg).toFixed(1)}g/kg (minimum 0.7g/kg)`);
  }

  // 6. Kontrollera allergier
  if (allergies && allergies.length > 0) {
    for (const meal of meals) {
      for (const item of meal.items || []) {
        const itemName = (item.food_name || '').toLowerCase();
        for (const allergy of allergies) {
          if (itemName.includes(allergy.toLowerCase())) {
            issues.push(`⚠️ Allergivarning: ${item.food_name} kan innehålla ${allergy}`);
          }
        }
      }
    }
  }

  return {
    success: true,
    data: {
      valid: issues.length === 0,
      issues,
      suggestions,
      actual_totals: {
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        kcal: Math.round(totalKcal)
      },
      target_totals: targetMacros,
      difference: {
        protein: Math.round((totalProtein - targetMacros.protein) * 10) / 10,
        carbs: Math.round((totalCarbs - targetMacros.carbs) * 10) / 10,
        fat: Math.round((totalFat - targetMacros.fat) * 10) / 10,
        kcal: Math.round(totalKcal - targetMacros.kcal)
      }
    }
  };
}

// =============================================================================
// PROPOSE MEAL PLAN (kräver godkännande)
// =============================================================================

function proposeMealPlan(meals: any[], summary: string, totalMacros?: any): ToolResult {
  return {
    success: true,
    requires_approval: true,
    approval_type: 'meal_plan',
    summary,
    data: {
      status: 'pending_approval',
      meals,
      total_macros: totalMacros,
      message: 'Förslaget väntar på ditt godkännande. Säg "OK" eller "Godkänn" för att spara.'
    }
  };
}

// =============================================================================
// SAVE MEAL PLAN
// =============================================================================

async function saveMealPlan(nutritionPlanId: string, meals: any[]): Promise<ToolResult> {
  try {
    // Hitta eller skapa GeneratedMealPlan
    let mealPlan = await prisma.generatedMealPlan.findFirst({
      where: { nutritionPlanId }
    });

    const formattedMeals = meals.map((meal, index) => ({
      mealIndex: meal.meal_index ?? index,
      mealName: meal.meal_name || `Måltid ${index + 1}`,
      foodItems: (meal.items || []).map((item: any) => ({
        foodId: item.food_id,
        foodName: item.food_name,
        grams: item.grams,
        category: item.category || 'protein',
        macros: {
          protein: item.macros?.protein || 0,
          carbs: item.macros?.carbs || 0,
          fat: item.macros?.fat || 0,
          kcal: item.macros?.kcal || 0
        }
      })),
      totalMacros: meal.macros || { protein: 0, carbs: 0, fat: 0, kcal: 0 }
    }));

    // Beräkna totala makros
    let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalKcal = 0;
    for (const meal of formattedMeals) {
      totalProtein += meal.totalMacros.protein || 0;
      totalCarbs += meal.totalMacros.carbs || 0;
      totalFat += meal.totalMacros.fat || 0;
      totalKcal += meal.totalMacros.kcal || 0;
    }

    if (mealPlan) {
      // Uppdatera befintlig
      mealPlan = await prisma.generatedMealPlan.update({
        where: { id: mealPlan.id },
        data: {
          meals: formattedMeals as any,
          actualMacros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat, kcal: totalKcal }
        }
      });
    } else {
      // Skapa ny - hämta plan för mealConfigs
      const plan = await prisma.clientNutritionPlan.findUnique({
        where: { id: nutritionPlanId },
        select: { mealsPerDay: true }
      });

      const mealsPerDay = plan?.mealsPerDay || 4;
      const defaultMealConfigs = Array.from({ length: mealsPerDay }, (_, i) => ({
        mealIndex: i,
        mealName: `Måltid ${i + 1}`,
        proteinPercent: Math.round(100 / mealsPerDay),
        carbsPercent: Math.round(100 / mealsPerDay),
        fatPercent: Math.round(100 / mealsPerDay)
      }));

      mealPlan = await prisma.generatedMealPlan.create({
        data: {
          nutritionPlanId,
          meals: formattedMeals as any,
          mealConfigs: defaultMealConfigs as any,
          targetMacros: { protein: 0, carbs: 0, fat: 0, kcal: 0 },
          actualMacros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat, kcal: totalKcal }
        }
      });
    }

    return {
      success: true,
      data: {
        message: '✅ Kostschemat har sparats!',
        meal_plan_id: mealPlan.id,
        meals_saved: formattedMeals.length,
        actual_macros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat, kcal: totalKcal }
      }
    };
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return {
      success: false,
      error: 'Kunde inte spara kostschemat'
    };
  }
}

// =============================================================================
// GET CLIENT INFO
// =============================================================================

async function getClientInfo(
  clientId?: string,
  nutritionPlanId?: string,
  context?: { nutritionPlanId?: string; clientId?: string }
): Promise<ToolResult> {
  try {
    const planId = nutritionPlanId || context?.nutritionPlanId;

    if (planId) {
      const plan = await prisma.clientNutritionPlan.findUnique({
        where: { id: planId },
        include: {
          client: true
        }
      });

      if (plan) {
        // Hämta klientminne om det finns
        const memory = await prisma.clientAIMemory.findFirst({
          where: { clientId: plan.clientId }
        });

        return {
          success: true,
          data: {
            client: {
              id: plan.clientId,
              name: plan.client.name,
              email: plan.client.email
            },
            nutrition_plan: {
              id: plan.id,
              weight_kg: plan.weight,
              height_cm: plan.height || undefined,
              age: plan.age || undefined,
              gender: plan.gender || undefined,
              daily_calories: plan.dailyCalorieTarget,
              protein_grams: plan.proteinGrams,
              carb_grams: plan.carbGrams,
              fat_grams: plan.fatGrams,
              meals_per_day: plan.mealsPerDay,
              workout_time: plan.workoutTime,
              calorie_goal: plan.calorieGoal,
              nutrition_system: plan.nutritionSystem
            },
            memory: memory ? {
              likes: memory.preferenser || [],
              works_well: memory.framgangsrika || [],
              avoid_patterns: memory.undvikMonster || []
            } : null
          }
        };
      }
    }

    const cId = clientId || context?.clientId;
    if (cId) {
      const client = await prisma.user.findUnique({
        where: { id: cId }
      });

      if (client) {
        return {
          success: true,
          data: {
            client: {
              id: client.id,
              name: client.name,
              email: client.email
            },
            nutrition_plan: null,
            memory: null
          }
        };
      }
    }

    return {
      success: false,
      error: 'Ingen klient eller kostplan hittades'
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      success: false,
      error: 'Kunde inte hämta klientinformation'
    };
  }
}

// =============================================================================
// UPDATE CLIENT MEMORY
// =============================================================================

async function updateClientMemory(
  clientId: string,
  preferenceType: 'likes' | 'dislikes' | 'works_well' | 'avoid_pattern',
  content: string
): Promise<ToolResult> {
  try {
    // Hitta eller skapa minne
    let memory = await prisma.clientAIMemory.findFirst({
      where: { clientId }
    });

    const fieldMap: Record<string, 'preferenser' | 'framgangsrika' | 'undvikMonster'> = {
      likes: 'preferenser',
      dislikes: 'preferenser',  // Sparas som "ogillar: X"
      works_well: 'framgangsrika',
      avoid_pattern: 'undvikMonster'
    };

    const field = fieldMap[preferenceType];
    const valueToAdd = preferenceType === 'dislikes' ? `ogillar: ${content}` : content;

    if (memory) {
      const currentValues = (memory[field] as string[]) || [];
      if (!currentValues.includes(valueToAdd)) {
        await prisma.clientAIMemory.update({
          where: { id: memory.id },
          data: {
            [field]: [...currentValues, valueToAdd]
          }
        });
      }
    } else {
      await prisma.clientAIMemory.create({
        data: {
          clientId,
          preferenser: field === 'preferenser' ? [valueToAdd] : [],
          framgangsrika: field === 'framgangsrika' ? [valueToAdd] : [],
          undvikMonster: field === 'undvikMonster' ? [valueToAdd] : []
        }
      });
    }

    return {
      success: true,
      data: {
        message: `Sparat: "${content}" som ${preferenceType}`,
        preference_type: preferenceType,
        content
      }
    };
  } catch (error) {
    console.error('Error updating client memory:', error);
    return {
      success: false,
      error: 'Kunde inte spara preferensen'
    };
  }
}

// =============================================================================
// CALCULATE BMR & TDEE
// =============================================================================

function calculateBmrTdee(input: {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: string;
}): ToolResult {
  // Mifflin-St Jeor
  let bmr: number;
  if (input.gender === 'male') {
    bmr = (10 * input.weight_kg) + (6.25 * input.height_cm) - (5 * input.age) + 5;
  } else {
    bmr = (10 * input.weight_kg) + (6.25 * input.height_cm) - (5 * input.age) - 161;
  }

  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };

  const factor = activityFactors[input.activity_level] || 1.55;
  const tdee = Math.round(bmr * factor);

  return {
    success: true,
    data: {
      bmr: Math.round(bmr),
      tdee,
      activity_factor: factor,
      activity_level: input.activity_level,
      explanation: `BMR beräknat med Mifflin-St Jeor: ${Math.round(bmr)} kcal. Med aktivitetsfaktor ${factor} blir TDEE: ${tdee} kcal.`
    }
  };
}

// =============================================================================
// CALCULATE MACRO TARGETS
// =============================================================================

function calculateMacroTargets(input: {
  tdee: number;
  goal: 'lose_weight' | 'build_muscle' | 'maintain' | 'health';
  intensity?: 'conservative' | 'moderate' | 'aggressive';
  weight_kg: number;
}): ToolResult {
  let targetCalories = input.tdee;
  let proteinPerKg = 1.8;

  // Justera kalorier baserat på mål
  if (input.goal === 'lose_weight') {
    const deficits: Record<string, number> = {
      conservative: 300,
      moderate: 400,
      aggressive: 500
    };
    const deficit = deficits[input.intensity || 'moderate'] || 400;
    targetCalories = input.tdee - deficit;
    proteinPerKg = 2.2; // Högre protein vid viktnedgång
  } else if (input.goal === 'build_muscle') {
    targetCalories = input.tdee + 250;
    proteinPerKg = 2.0;
  } else {
    proteinPerKg = 1.8;
  }

  // Beräkna makros
  const proteinGrams = Math.round(proteinPerKg * input.weight_kg);
  const proteinCalories = proteinGrams * 4;

  // Fett: 25-30% av kalorier, minimum 0.7g/kg
  const minFatGrams = Math.round(0.7 * input.weight_kg);
  const fatCaloriesPercent = 0.28 * targetCalories;
  const fatGrams = Math.max(minFatGrams, Math.round(fatCaloriesPercent / 9));
  const fatCalories = fatGrams * 9;

  // Kolhydrater: resterande
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);

  return {
    success: true,
    data: {
      daily_calories: Math.round(targetCalories),
      protein_grams: proteinGrams,
      carb_grams: carbGrams,
      fat_grams: fatGrams,
      protein_per_kg: proteinPerKg,
      fat_per_kg: Math.round((fatGrams / input.weight_kg) * 10) / 10,
      goal: input.goal,
      explanation: `Beräknat för ${input.goal === 'lose_weight' ? 'viktnedgång' : input.goal === 'build_muscle' ? 'muskelbyggande' : 'underhåll'}. Protein: ${proteinPerKg}g/kg (${proteinGrams}g), Fett: ${fatGrams}g, Kolhydrater: ${carbGrams}g. Totalt: ${Math.round(targetCalories)} kcal.`
    }
  };
}

// =============================================================================
// PROPOSE NUTRITION PLAN (kräver godkännande)
// =============================================================================

function proposeNutritionPlan(input: any): ToolResult {
  return {
    success: true,
    requires_approval: true,
    approval_type: 'nutrition_plan',
    summary: `Ny kostplan: ${input.daily_calories} kcal/dag, P${input.protein_grams}g K${input.carb_grams}g F${input.fat_grams}g, ${input.meals_per_day || 4} måltider/dag`,
    data: {
      status: 'pending_approval',
      plan_details: input,
      message: 'Kostplanen är redo att skapas. Säg "OK" eller "Godkänn" för att bekräfta.'
    }
  };
}

// =============================================================================
// HELPER: Decimal -> Number
// =============================================================================

function toNum(val: number | { toNumber(): number } | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'toNumber' in val) return val.toNumber();
  return Number(val) || 0;
}

// =============================================================================
// SEARCH RECIPES
// =============================================================================

async function searchRecipes(
  query: string,
  mealType?: string,
  dietaryTags?: string[],
  maxCalories?: number,
  minProtein?: number,
  maxResults: number = 10
): Promise<ToolResult> {
  try {
    const where: any = {
      published: true,
      title: {
        contains: query,
        mode: 'insensitive'
      }
    };

    if (mealType && mealType !== 'all') {
      where.mealType = mealType;
    }

    if (dietaryTags && dietaryTags.length > 0) {
      where.dietaryTags = {
        hasEvery: dietaryTags
      };
    }

    if (maxCalories) {
      where.caloriesPerServing = {
        lte: maxCalories
      };
    }

    if (minProtein) {
      where.proteinPerServing = {
        gte: minProtein
      };
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        category: true,
        ingredients: {
          include: {
            foodItem: true
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      take: Math.min(maxResults, 20),
      orderBy: [
        { title: 'asc' }
      ]
    });

    const results = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category.name,
      meal_type: recipe.mealType,
      servings: recipe.servings,
      prep_time: recipe.prepTimeMinutes,
      cook_time: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      dietary_tags: recipe.dietaryTags,
      per_serving: {
        kcal: toNum(recipe.caloriesPerServing),
        protein: toNum(recipe.proteinPerServing),
        carbs: toNum(recipe.carbsPerServing),
        fat: toNum(recipe.fatPerServing)
      },
      ingredients_count: recipe.ingredients.length,
      cover_image: recipe.coverImage
    }));

    return {
      success: true,
      data: {
        query,
        results,
        total_found: results.length
      }
    };
  } catch (error) {
    console.error('Error searching recipes:', error);
    return {
      success: false,
      error: 'Kunde inte söka i receptbanken'
    };
  }
}

// =============================================================================
// SUGGEST RECIPES FOR MEAL
// =============================================================================

async function suggestRecipesForMeal(
  mealIndex: number,
  targetMacros: { protein?: number; carbs?: number; fat?: number; kcal?: number },
  mealType?: string,
  excludeIngredients?: string[]
): Promise<ToolResult> {
  try {
    // Map meal index to meal type if not provided
    const mealTypeMap: Record<number, string> = {
      0: 'breakfast',
      1: 'lunch',
      2: 'snack',
      3: 'dinner',
      4: 'snack',
      5: 'snack'
    };

    const targetType = mealType || mealTypeMap[mealIndex] || 'lunch';

    // Calculate acceptable ranges (±30% of target)
    const kcalMin = targetMacros.kcal ? targetMacros.kcal * 0.7 : 0;
    const kcalMax = targetMacros.kcal ? targetMacros.kcal * 1.3 : 9999;
    const proteinMin = targetMacros.protein ? targetMacros.protein * 0.7 : 0;

    const recipes = await prisma.recipe.findMany({
      where: {
        published: true,
        OR: [
          { mealType: targetType },
          { mealType: null }  // Include recipes without a specific meal type
        ],
        caloriesPerServing: {
          gte: kcalMin,
          lte: kcalMax
        },
        proteinPerServing: {
          gte: proteinMin
        }
      },
      include: {
        category: true,
        ingredients: {
          include: {
            foodItem: true
          }
        }
      },
      take: 20,
      orderBy: {
        proteinPerServing: 'desc'  // Prioritize high protein
      }
    });

    // Filter out recipes with excluded ingredients
    let filteredRecipes = recipes;
    if (excludeIngredients && excludeIngredients.length > 0) {
      filteredRecipes = recipes.filter(recipe => {
        const ingredientNames = recipe.ingredients.map(i =>
          (i.foodItem as any)?.name?.toLowerCase() || ''
        );
        return !excludeIngredients.some(excluded =>
          ingredientNames.some(name => name.includes(excluded.toLowerCase()))
        );
      });
    }

    // Score and sort recipes by how well they match the target macros
    const scoredRecipes = filteredRecipes.map(recipe => {
      const kcal = toNum(recipe.caloriesPerServing);
      const protein = toNum(recipe.proteinPerServing);
      const carbs = toNum(recipe.carbsPerServing);
      const fat = toNum(recipe.fatPerServing);

      // Calculate match score (lower is better)
      let score = 0;
      if (targetMacros.kcal) score += Math.abs(kcal - targetMacros.kcal) / targetMacros.kcal;
      if (targetMacros.protein) score += Math.abs(protein - targetMacros.protein) / targetMacros.protein;
      if (targetMacros.carbs) score += Math.abs(carbs - targetMacros.carbs) / targetMacros.carbs;
      if (targetMacros.fat) score += Math.abs(fat - targetMacros.fat) / targetMacros.fat;

      return { recipe, score };
    });

    scoredRecipes.sort((a, b) => a.score - b.score);

    const suggestions = scoredRecipes.slice(0, 5).map(({ recipe, score }) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category.name,
      servings: recipe.servings,
      prep_time: recipe.prepTimeMinutes,
      cook_time: recipe.cookTimeMinutes,
      per_serving: {
        kcal: toNum(recipe.caloriesPerServing),
        protein: toNum(recipe.proteinPerServing),
        carbs: toNum(recipe.carbsPerServing),
        fat: toNum(recipe.fatPerServing)
      },
      match_score: Math.round((1 - score / 4) * 100),  // Convert to percentage
      dietary_tags: recipe.dietaryTags,
      cover_image: recipe.coverImage
    }));

    return {
      success: true,
      data: {
        meal_index: mealIndex,
        target_macros: targetMacros,
        suggestions,
        message: suggestions.length > 0
          ? `Hittade ${suggestions.length} recept som passar för måltid ${mealIndex + 1}`
          : 'Inga recept hittades som matchar kriterierna'
      }
    };
  } catch (error) {
    console.error('Error suggesting recipes:', error);
    return {
      success: false,
      error: 'Kunde inte hitta receptförslag'
    };
  }
}

// =============================================================================
// GET RECIPE DETAILS
// =============================================================================

async function getRecipeDetails(recipeId: string): Promise<ToolResult> {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        category: true,
        subcategory: true,
        ingredients: {
          include: {
            foodItem: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        instructions: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });

    if (!recipe) {
      return {
        success: false,
        error: 'Receptet hittades inte'
      };
    }

    const ingredients = recipe.ingredients.map(ing => ({
      name: (ing.foodItem as any)?.name || 'Okänt',
      amount_grams: toNum(ing.amount),
      display_amount: ing.displayAmount,
      display_unit: ing.displayUnit,
      optional: ing.optional
    }));

    const instructions = recipe.instructions.map(inst => ({
      step: inst.stepNumber,
      instruction: inst.instruction,
      duration: inst.duration
    }));

    return {
      success: true,
      data: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        category: recipe.category.name,
        subcategory: recipe.subcategory?.name,
        servings: recipe.servings,
        prep_time_minutes: recipe.prepTimeMinutes,
        cook_time_minutes: recipe.cookTimeMinutes,
        total_time_minutes: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
        difficulty: recipe.difficulty,
        cuisine_type: recipe.cuisineType,
        meal_type: recipe.mealType,
        dietary_tags: recipe.dietaryTags,
        per_serving: {
          kcal: toNum(recipe.caloriesPerServing),
          protein: toNum(recipe.proteinPerServing),
          carbs: toNum(recipe.carbsPerServing),
          fat: toNum(recipe.fatPerServing)
        },
        ingredients,
        instructions,
        cover_image: recipe.coverImage,
        video_url: recipe.videoUrl
      }
    };
  } catch (error) {
    console.error('Error getting recipe details:', error);
    return {
      success: false,
      error: 'Kunde inte hämta receptet'
    };
  }
}
