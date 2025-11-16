import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Hallon eller blåbär': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Whey': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Keso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havregryn/havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Frukostplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const hallon = await findOrCreateFoodItem('Hallon eller blåbär')
  const whey = await findOrCreateFoodItem('Whey')
  const keso = await findOrCreateFoodItem('Keso')
  const havregryn = await findOrCreateFoodItem('Havregryn/havremjöl')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostplättar',
      description: 'Mixa gärna havregrynen till ett fint pulver!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/v82LjLPn/2025-11-14-11-01-17-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: hallon.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: whey.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 74,
            displayAmount: '74',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vatten.id,
            amount: 45, // 3 msk ≈ 45ml
            displayAmount: '3',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Väg upp alla ingredienser.',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg allt utom bären i en mixer (går bra med stavmixer) och mixa till en slät smet.',
          },
          {
            stepNumber: 3,
            instruction: 'Klicka ut små plättar i pannan och stek på medeltemperatur.',
          },
          {
            stepNumber: 4,
            instruction: 'Klart! Glöm ej bären!',
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
