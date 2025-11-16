import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Keso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Cocktailtomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
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
  console.log('🍳 Creating Sofias mellanmålsomelett recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const keso = await findOrCreateFoodItem('Keso')
  const cocktailtomater = await findOrCreateFoodItem('Cocktailtomater')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Sofias mellanmålsomelett',
      description: 'Omelett i ugn',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/mZ0qJH2j/2025-11-14-12-39-17-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 263,
      proteinPerServing: 31,
      carbsPerServing: 6,
      fatPerServing: 13,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 112,
            displayAmount: '112',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 131,
            displayAmount: '131',
            displayUnit: 'g',
          },
          {
            foodItemId: cocktailtomater.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ägg och keso i en ugnssäker form.',
          },
          {
            stepNumber: 2,
            instruction: 'Skär cocktailtomaterna på mitten och lägg i omeletten.',
          },
          {
            stepNumber: 3,
            instruction: 'In i ugnen på 200 grader i ca 20 min tills omeletten fått gyllene färg.',
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
