import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Bär, gärna hallon': { calories: 52, protein: 1.2, carbs: 12, fat: 0.6 },
  'Casein Chokladdrӧm': { calories: 385, protein: 80, carbs: 8, fat: 3 },
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
  console.log('🍫 Creating Casein-kladdkaka recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const bar = await findOrCreateFoodItem('Bär, gärna hallon')
  const casein = await findOrCreateFoodItem('Casein Chokladdrӧm')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Casein-kladdkaka',
      description: 'Ett lyxigt kvällsmål eller efterrätt',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/bw0R6GsN/2025-11-14-12-38-33-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 114,
      proteinPerServing: 19,
      carbsPerServing: 4,
      fatPerServing: 2,
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
            foodItemId: casein.id,
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
            instruction: 'Blanda casein med vatten tills du fått en konsistens liknande en kladdkakesmet',
          },
          {
            stepNumber: 2,
            instruction: 'Töm över smeten till en platttalrik och bred ut smeten över tallriken',
          },
          {
            stepNumber: 3,
            instruction: 'Micra försiktigt i ca 1-2min, eller tills det börjar bubbla på toppen av smeten, ställ därefter in tallriken i kylskåpet i ca5min',
          },
          {
            stepNumber: 4,
            instruction: 'Toppa kakan med färska eller frysta bär',
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
