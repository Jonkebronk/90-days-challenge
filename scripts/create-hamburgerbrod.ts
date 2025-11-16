import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Naturell kvarg': { calories: 68, protein: 11, carbs: 4, fat: 0.2 },
  'Magert nötkött': { calories: 151, protein: 20, carbs: 0, fat: 7.5 },
  'Bovetemjöl': { calories: 343, protein: 13, carbs: 71, fat: 3.4 },
  'Bakpulver': { calories: 53, protein: 0, carbs: 28, fat: 0 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
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
  console.log('🍔 Creating Hamburgerbröd recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kvarg = await findOrCreateFoodItem('Naturell kvarg')
  const notkott = await findOrCreateFoodItem('Magert nötkött')
  const bovetemjol = await findOrCreateFoodItem('Bovetemjöl')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Hamburgerbröd',
      description: 'Sjukt gott hamburgerbröd',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nz39w9yM/2025-11-15-11-46-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 442,
      proteinPerServing: 47,
      carbsPerServing: 43,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kvarg.id,
            amount: 49,
            displayAmount: '49',
            displayUnit: 'g',
          },
          {
            foodItemId: notkott.id,
            amount: 147,
            displayAmount: '147',
            displayUnit: 'g',
          },
          {
            foodItemId: bovetemjol.id,
            amount: 68,
            displayAmount: '68',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 1.25, // 0.25 tsk ≈ 1.25g
            displayAmount: '0.25',
            displayUnit: 'tsk',
            notes: 'Frivilligt'
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
            notes: 'Att äta utöver receptet (för en komplett lunch)'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Rör ihop till en deg med gaffel.',
          },
          {
            stepNumber: 2,
            instruction: 'Rulla ihop till en boll och platta till.',
          },
          {
            stepNumber: 3,
            instruction: 'Nagga med en gaffel',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg i airfryer (alt ugn) i 15-20 min på 150 grader.',
          },
          {
            stepNumber: 5,
            instruction: 'Gör en hamburgare av magert nötkött.',
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
