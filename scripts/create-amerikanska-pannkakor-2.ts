import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär': { calories: 40, protein: 1, carbs: 9, fat: 0.3 },
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havre': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
}

async function findOrCreateFoodItem(name: string) {
  // First try to find existing
  let foodItem = await prisma.foodItem.findFirst({
    where: {
      name: { contains: name, mode: 'insensitive' }
    }
  })

  if (!foodItem) {
    const nutrition = nutritionDatabase[name] || { calories: 100, protein: 5, carbs: 15, fat: 2 }

    foodItem = await prisma.foodItem.create({
      data: {
        name,
        calories: nutrition.calories,
        proteinG: nutrition.protein,
        carbsG: nutrition.carbs,
        fatG: nutrition.fat,
        commonServingSize: '100g',
      },
    })
    console.log(`✅ Created FoodItem: ${name}`)
  } else {
    console.log(`✓ Found existing FoodItem: ${name}`)
  }

  return foodItem
}

async function main() {
  console.log('🥞 Creating Amerikanska pannkakor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Bär')
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havre = await findOrCreateFoodItem('Havre')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Amerikanska pannkakor',
      description: 'Lite lyxigare pannkakor till helgfrukosten!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/JzHtYR9c/2025-11-14-10-08-36-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 485,
      proteinPerServing: 40,
      carbsPerServing: 38,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 124,
            displayAmount: '124',
            displayUnit: 'g',
          },
          {
            foodItemId: bar.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: linfroolja.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 101,
            displayAmount: '101',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: havre.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 7.5, // 1.5 tsk ≈ 7.5g
            displayAmount: '1.5',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Vispa äggvita hårt tills det blir ett vitt skum',
          },
          {
            stepNumber: 2,
            instruction: 'Rör ihop havre, kvarg, bakpulver, linfröolja och äggula',
          },
          {
            stepNumber: 3,
            instruction: 'Vänd ner äggvitan i smeten',
          },
          {
            stepNumber: 4,
            instruction: 'Stek med kokosolja på medeltemperatur. Vänd när sidorna börjar mörkna och ytan känns något fast',
          },
          {
            stepNumber: 5,
            instruction: 'Blanda bär och kvarg (med fördel smaksatt, typ blåbär)',
          },
        ],
      },
    },
  })

  console.log(`✅ Recipe created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - ${recipe.servings} portion`)
  console.log(`   - ${recipe.caloriesPerServing} kcal per portion`)
  console.log(`   - ${recipe.proteinPerServing}g protein`)
  console.log(`   - ${recipe.carbsPerServing}g carbs`)
  console.log(`   - ${recipe.fatPerServing}g fat`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
