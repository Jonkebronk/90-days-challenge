import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Avokado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Vaniljpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Citronsaft': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
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
  console.log('🥑 Creating Avokadoröra mellanmål recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const avokado = await findOrCreateFoodItem('Avokado')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')
  const citronsaft = await findOrCreateFoodItem('Citronsaft')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Avokadoröra mellanmål',
      description: 'Mixa avokado, vaniljkvarg, citronsaft och vaniljpulver.',
      categoryId: category.id,
      servings: 1,
      coverImage: null,
      caloriesPerServing: 256,
      proteinPerServing: 18,
      carbsPerServing: 6,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: avokado.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 131,
            displayAmount: '131',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljpulver.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: citronsaft.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa alla ingredienser',
          },
          {
            stepNumber: 2,
            instruction: 'Servera med hallon',
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
