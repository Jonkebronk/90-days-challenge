import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mandlar/valfria nötter': { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },
  'Naturell kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Proteinpulver': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥜 Creating Nötig Proteinkvarg recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const notter = await findOrCreateFoodItem('Mandlar/valfria nötter')
  const kvarg = await findOrCreateFoodItem('Naturell kvarg')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Nötig Proteinkvarg',
      description: 'Smarrigt mellanmål där du kan variera smaken otroligt mycket. Går även att använda till frukost.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/mrF52Zr0/2025-11-14-12-29-26-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 257,
      proteinPerServing: 22,
      carbsPerServing: 12,
      fatPerServing: 14,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notter.id,
            amount: 27,
            displayAmount: '27',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 86,
            displayAmount: '86',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 9,
            displayAmount: '9',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda kvarg, proteinpulver och vatten.',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka nötterna',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda nötterna tillsammans med kvargblandningen',
          },
          {
            stepNumber: 4,
            instruction: 'Ät direkt eller låt stå i kyl/frys',
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
