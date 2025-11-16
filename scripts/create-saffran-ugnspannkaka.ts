import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vaniljsocker': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Saffran ugnspannkaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const vaniljsocker = await findOrCreateFoodItem('Vaniljsocker')
  const saffran = await findOrCreateFoodItem('Saffran')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffran ugnspannkaka',
      description: 'Ugnspannkaka med saffran i!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/KjnRfb4F/2025-11-14-11-22-36-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 40,
      carbsPerServing: 35,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: vaniljsocker.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Vispa ihop ägg, kvarg, havremjöl, vaniljsocker, saffran och vatten.',
          },
          {
            stepNumber: 2,
            instruction: 'Häll ner i en ugnssäker form, sätt ugnen på 200 grader. Ställ in när den har nått önskad värme',
          },
          {
            stepNumber: 3,
            instruction: 'Låt stå 25-35min beroende på hur du vill ha ugnspannkakan.',
          },
          {
            stepNumber: 4,
            instruction: 'Ta ut och låt svalna innan servering.',
          },
          {
            stepNumber: 5,
            instruction: 'Servera med vaniljkvarg, bär och lite sötströ',
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
