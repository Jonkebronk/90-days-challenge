import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Jordnötssmör': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'Cashewnötter naturella': { calories: 553, protein: 18.2, carbs: 30.2, fat: 43.9 },
  'Kasein chokladdrӧm Svenska kosttillskott': { calories: 385, protein: 80, carbs: 8, fat: 3 },
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
  console.log('🍫 Creating "Snickers"-röra recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const jordnotssmor = await findOrCreateFoodItem('Jordnötssmör')
  const cashewnotter = await findOrCreateFoodItem('Cashewnötter naturella')
  const kasein = await findOrCreateFoodItem('Kasein chokladdrӧm Svenska kosttillskott')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: '"Snickers"-röra',
      description: 'En kaseinblandning som smakar Snickers!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/y6XQQr5r/2025-11-14-12-49-50-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 262,
      proteinPerServing: 23,
      carbsPerServing: 10,
      fatPerServing: 15,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: jordnotssmor.id,
            amount: 14,
            displayAmount: '14',
            displayUnit: 'g',
          },
          {
            foodItemId: cashewnotter.id,
            amount: 14,
            displayAmount: '14',
            displayUnit: 'g',
          },
          {
            foodItemId: kasein.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda kaseinpulvret med vatten, lite vatten i taget så det blir en jämn smet.',
          },
          {
            stepNumber: 2,
            instruction: 'Använd så mycket vatten så konsistens blir som kladdkakesmet',
          },
          {
            stepNumber: 3,
            instruction: 'Rör ner jordnötssmöret',
          },
          {
            stepNumber: 4,
            instruction: 'Hacka nötterna och rör ner',
          },
          {
            stepNumber: 5,
            instruction: 'Klart!',
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
