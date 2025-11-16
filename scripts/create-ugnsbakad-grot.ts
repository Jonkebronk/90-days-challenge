import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär tex hallon & blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Solrosfrön': { calories: 584, protein: 20.8, carbs: 20, fat: 51.5 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Banan (en halv)': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
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
  console.log('🥣 Creating Ugnsbakad gröt recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Bär tex hallon & blåbär')
  const solrosfron = await findOrCreateFoodItem('Solrosfrön')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const banan = await findOrCreateFoodItem('Banan (en halv)')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ugnsbakad gröt',
      description: 'Lyxa till morgonen med ugnsbakad gröt.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/jSpM1QSy/2025-11-14-10-59-45-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 555,
      proteinPerServing: 38,
      carbsPerServing: 53,
      fatPerServing: 19,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 79,
            displayAmount: '79',
            displayUnit: 'g',
          },
          {
            foodItemId: bar.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: solrosfron.id,
            amount: 12,
            displayAmount: '12',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: banan.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g (en halv)',
          },
          {
            foodItemId: kanel.id,
            amount: 2, // 2 krm ≈ 2g
            displayAmount: '2',
            displayUnit: 'krm',
          },
          {
            foodItemId: kardemumma.id,
            amount: 2, // 2 krm ≈ 2g
            displayAmount: '2',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Mosa en halv banan.',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda samman alla ingredienser förutom bären och ca 25 gram kvarg',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg ingredienserna i en ugnssäker form.',
          },
          {
            stepNumber: 5,
            instruction: 'Toppa med bär.',
          },
          {
            stepNumber: 6,
            instruction: 'Sätt in mitt i ugnen.',
          },
          {
            stepNumber: 7,
            instruction: 'Grädda ca 20 min.',
          },
          {
            stepNumber: 8,
            instruction: 'Servera med en klick kvarg!',
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
