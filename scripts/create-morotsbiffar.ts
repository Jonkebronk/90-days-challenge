import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mager nötfärs (<10% fett)': { calories: 155, protein: 21, carbs: 0, fat: 7 },
  'Keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  'Morötter': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
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
  console.log('🥕 Creating Morotsbiffar recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Mager nötfärs (<10% fett)')
  const keso = await findOrCreateFoodItem('Keso')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')
  const morotter = await findOrCreateFoodItem('Morötter')
  const lok = await findOrCreateFoodItem('Lök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Morotsbiffar',
      description: 'Morotsbiffar på köttfärs eller vegetariskfärs.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/DyChScr5/2025-11-14-14-01-03-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 45,
      carbsPerServing: 60,
      fatPerServing: 6,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 125,
            displayAmount: '125',
            displayUnit: 'g',
            notes: '<10 % fett/Vegetariskfärs'
          },
          {
            foodItemId: keso.id,
            amount: 45,
            displayAmount: '45',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: morotter.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt på ugnen på 200°',
          },
          {
            stepNumber: 2,
            instruction: 'Skär potatisen i klyftor och lägg på en plåt med lite olja. Krydda med valfri kryddda om så önskas, in i ugnen.',
          },
          {
            stepNumber: 3,
            instruction: 'Mosa keson i en bunke som rymmer för färsen och morotterna.',
          },
          {
            stepNumber: 4,
            instruction: 'Riv morotterna och blanda i färsen, krydda med spiskummin eller önskade kryddor.',
          },
          {
            stepNumber: 5,
            instruction: 'Stek löken i önskade bitar på medelvärme så de blir mjuka och lite färg.',
          },
          {
            stepNumber: 6,
            instruction: 'Lägg av löken och forma biffar efter önskad storlek och stek till de får lite färg.',
          },
          {
            stepNumber: 7,
            instruction: 'Gör gärna en dressing till och sedan njut!',
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
