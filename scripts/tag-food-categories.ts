/**
 * Script to auto-tag food items with macroCategory based on their macro profile
 *
 * Categories:
 * - protein: High protein foods (>15g protein per 100g, protein is dominant macro by calories)
 * - carb: High carb foods (>40g carbs per 100g, carbs is dominant macro by calories)
 * - fat: High fat foods (>15g fat per 100g, fat is dominant macro by calories)
 * - vegetable: Low calorie, high fiber foods (<50 kcal per 100g)
 * - sauce: Items in "Såser" category or with "sås" in name
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type MacroCategory = 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce';

function determineCategory(food: {
  name: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  foodCategory?: { name: string } | null;
}): MacroCategory | null {
  const protein = Number(food.proteinG) || 0;
  const carbs = Number(food.carbsG) || 0;
  const fat = Number(food.fatG) || 0;
  const calories = Number(food.calories) || 0;
  const name = food.name.toLowerCase();
  const categoryName = food.foodCategory?.name?.toLowerCase() || '';

  // Check for sauce
  if (
    categoryName.includes('sås') ||
    name.includes('sås') ||
    name.includes('dressing') ||
    name.includes('majonnäs') ||
    name.includes('ketchup') ||
    name.includes('senap')
  ) {
    return 'sauce';
  }

  // Check for vegetables (low calorie)
  if (
    calories < 50 &&
    (categoryName.includes('grönsak') ||
      categoryName.includes('sallad') ||
      name.includes('sallad') ||
      name.includes('spenat') ||
      name.includes('broccoli') ||
      name.includes('gurka') ||
      name.includes('tomat') ||
      name.includes('paprika') ||
      name.includes('lök') ||
      name.includes('morot') ||
      name.includes('kål'))
  ) {
    return 'vegetable';
  }

  // Calculate calories from each macro
  const proteinCals = protein * 4;
  const carbCals = carbs * 4;
  const fatCals = fat * 9;
  const totalMacroCals = proteinCals + carbCals + fatCals;

  if (totalMacroCals === 0) return null;

  // Calculate percentage of calories from each macro
  const proteinPercent = proteinCals / totalMacroCals;
  const carbPercent = carbCals / totalMacroCals;
  const fatPercent = fatCals / totalMacroCals;

  // Protein source: >15g protein per 100g AND protein is significant
  if (protein >= 15 && proteinPercent >= 0.35) {
    return 'protein';
  }

  // Carb source: >40g carbs per 100g AND carbs is dominant
  if (carbs >= 40 && carbPercent >= 0.5) {
    return 'carb';
  }

  // Fat source: >15g fat per 100g AND fat is significant
  if (fat >= 15 && fatPercent >= 0.4) {
    return 'fat';
  }

  // Secondary checks for borderline cases
  if (protein >= 10 && proteinPercent >= 0.4) {
    return 'protein';
  }

  if (carbs >= 30 && carbPercent >= 0.6) {
    return 'carb';
  }

  if (fat >= 10 && fatPercent >= 0.5) {
    return 'fat';
  }

  return null;
}

async function main() {
  console.log('Tagging food items with macroCategory...\n');

  const foods = await prisma.foodItem.findMany({
    include: {
      foodCategory: true,
    },
  });

  const stats = {
    protein: 0,
    carb: 0,
    fat: 0,
    vegetable: 0,
    sauce: 0,
    untagged: 0,
  };

  const updates: { id: string; category: MacroCategory }[] = [];

  for (const food of foods) {
    const category = determineCategory(food);

    if (category) {
      updates.push({ id: food.id, category });
      stats[category]++;
    } else {
      stats.untagged++;
    }
  }

  // Perform updates
  console.log('Updating database...\n');

  for (const update of updates) {
    await prisma.foodItem.update({
      where: { id: update.id },
      data: { macroCategory: update.category },
    });
  }

  console.log('Results:');
  console.log(`  Protein sources: ${stats.protein}`);
  console.log(`  Carb sources: ${stats.carb}`);
  console.log(`  Fat sources: ${stats.fat}`);
  console.log(`  Vegetables: ${stats.vegetable}`);
  console.log(`  Sauces: ${stats.sauce}`);
  console.log(`  Untagged: ${stats.untagged}`);
  console.log(`\nTotal tagged: ${updates.length} / ${foods.length}`);

  // Show some examples
  console.log('\n--- Example tagged items ---');

  const examples = await prisma.foodItem.findMany({
    where: { macroCategory: { not: null } },
    take: 20,
    select: {
      name: true,
      macroCategory: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
    },
  });

  for (const ex of examples) {
    console.log(`${ex.macroCategory?.padEnd(10)} | ${ex.name.substring(0, 30).padEnd(30)} | P:${ex.proteinG}g K:${ex.carbsG}g F:${ex.fatG}g`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
