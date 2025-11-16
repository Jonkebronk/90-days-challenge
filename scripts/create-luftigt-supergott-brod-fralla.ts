import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Naturell Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Durumvetemjöl': { calories: 339, protein: 13, carbs: 70, fat: 1.5 },
  'Lite örtsalt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver(kan uteslutas)': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Chiafrön (kan uteslutas)': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
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
  console.log('🍞 Creating Luftigt supergott bröd/fralla recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const naturellkvarg = await findOrCreateFoodItem('Naturell Kvarg')
  const durumvetemjol = await findOrCreateFoodItem('Durumvetemjöl')
  const ortsalt = await findOrCreateFoodItem('Lite örtsalt')
  const bakpulver = await findOrCreateFoodItem('Bakpulver(kan uteslutas)')
  const chiafron = await findOrCreateFoodItem('Chiafrön (kan uteslutas)')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Luftigt supergott bröd/fralla',
      description: 'En luftig fralla på durumvetemjöl till frukost.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/QxhpzYDk/2025-11-14-11-30-55-NVIDIA-Ge-Force-Overlay-DT.png',
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
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: naturellkvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: durumvetemjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: ortsalt.id,
            amount: 1,
            displayAmount: 'Lite',
            displayUnit: '',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: chiafron.id,
            amount: 5,
            displayAmount: 'Lite',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda mjöl, örtsalt och bakpulver.',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda i ägg och kvarg till en smet.',
          },
          {
            stepNumber: 4,
            instruction: '"Klicka upp" på en bulle plåt. Strö över lite chiafrön.',
          },
          {
            stepNumber: 5,
            instruction: 'In i ugnen ca 20 minuter eller tills den fått färg.',
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
