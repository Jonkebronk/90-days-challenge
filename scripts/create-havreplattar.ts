import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Bär/Frukt': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Proteinpulver': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Havreplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const bar = await findOrCreateFoodItem('Bär/Frukt')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Havreplättar',
      description: 'Snabb och enkel frukost.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/vZVbVs2H/2025-11-14-11-52-11-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 305,
      proteinPerServing: 26,
      carbsPerServing: 34,
      fatPerServing: 6,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: bar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 19,
            displayAmount: '19',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 49,
            displayAmount: '49',
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
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: kanel.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kardemumma.id,
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
            instruction: 'Blanda ihop havregryn med proteinpulver och vatten i en bunke med en gaffel',
          },
          {
            stepNumber: 2,
            instruction: 'Häll ut en klick i stekpannan, platta till med gaffel så den blir tunnare',
          },
          {
            stepNumber: 3,
            instruction: 'Vänd på plåtten när du ser att kanterna får färg',
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
