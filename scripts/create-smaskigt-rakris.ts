import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Räkor': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  'Basmatiris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Purjolök': { calories: 61, protein: 1.5, carbs: 14, fat: 0.3 },
  'Champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Färsk ingefära': { calories: 80, protein: 1.8, carbs: 18, fat: 0.8 },
  'Färsk chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
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
  console.log('🍤 Creating Smaskigt räkris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Räkor')
  const basmatiris = await findOrCreateFoodItem('Basmatiris')
  const purjolok = await findOrCreateFoodItem('Purjolök')
  const champinjoner = await findOrCreateFoodItem('Champinjoner')
  const paprika = await findOrCreateFoodItem('Paprika')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const ingefara = await findOrCreateFoodItem('Färsk ingefära')
  const chili = await findOrCreateFoodItem('Färsk chili')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Smaskigt räkris',
      description: 'Gott och smakrikt ris med räkor och heta grönsker',
      categoryId: category.id,
      servings: 1,
      coverImage: '', // No image URL provided yet
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: rakor.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: basmatiris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: purjolok.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
          {
            foodItemId: ingefara.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
          },
          {
            foodItemId: chili.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka riset och låt svalna något',
          },
          {
            stepNumber: 2,
            instruction: 'Stek ihop fint hackad purjolök, paprika och skivade champinjoner',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda grönskerna med riset',
          },
          {
            stepNumber: 4,
            instruction: 'Forstek hackad chili, riven ingefära och pressad vitlök på hög värme tills att de fått lite färg',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg därefter i räkorna och stek ett par minuter tills att de är klara',
          },
          {
            stepNumber: 6,
            instruction: 'Blanda ihop räkorna med grönskerna och riset och krydda ev. med lite herbamare',
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
