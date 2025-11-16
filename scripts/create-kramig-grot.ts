import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Vaniljproteinpulver': { calories: 380, protein: 80, carbs: 8, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Walden Farms chokladsås': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥣 Creating Krämig gröt med vaniljkräm, blåbär och chokladsås recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const blabar = await findOrCreateFoodItem('Blåbär')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const vaniljproteinpulver = await findOrCreateFoodItem('Vaniljproteinpulver')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const chokladsas = await findOrCreateFoodItem('Walden Farms chokladsås')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Krämig gröt med vaniljkräm, blåbär och chokladsås',
      description: 'Krämig gröt med vaniljkräm, blåbär och chokladsås',
      categoryId: category.id,
      servings: 1,
      caloriesPerServing: 491,
      proteinPerServing: 42,
      carbsPerServing: 35,
      fatPerServing: 19,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: blabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 74,
            displayAmount: '74',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljproteinpulver.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 150, // 1.5 dl = 150ml
            displayAmount: '1.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: chokladsas.id,
            amount: 0,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mät upp havregrynen i en kastrull tillsammans med 1.5 dl vatten. Koka gröten',
          },
          {
            stepNumber: 2,
            instruction: 'När gröten är klar, blanda i ett ägg. Rör om ordentligt tills du får en krämig gröt',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda 75 gram kvarg med 15 gram vaniljproteinpulver (tillsätt ev. Lite vatten)',
          },
          {
            stepNumber: 4,
            instruction: 'Toppa gröten med "vaniljkrämen"',
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
