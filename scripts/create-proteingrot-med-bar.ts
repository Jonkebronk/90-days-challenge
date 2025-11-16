import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Nötsmör': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'Wheyprotein': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🥣 Creating Proteingröt med bär recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const bar = await findOrCreateFoodItem('Bär')
  const notsmor = await findOrCreateFoodItem('Nötsmör')
  const wheyprotein = await findOrCreateFoodItem('Wheyprotein')
  const havregryn = await findOrCreateFoodItem('Havregryn')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Proteingröt med bär',
      description: 'Ett smakrikt och färgglatt alternativ till hederlig gröt.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/rpRDYxPp/2025-11-14-10-45-48-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 494,
      proteinPerServing: 32,
      carbsPerServing: 43,
      fatPerServing: 21,
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
            foodItemId: notsmor.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: wheyprotein.id,
            amount: 29,
            displayAmount: '29',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda havregryn med dubbla mängden vatten. Tillaga i micron ca 2 min på 800 effekt',
          },
          {
            stepNumber: 2,
            instruction: 'Väg upp proteinet och blanda det med gröten, tillsätt vatten om önskas. (För konsistensen.)',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt bär och nötsmör',
          },
          {
            stepNumber: 4,
            instruction: 'Njut!',
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
