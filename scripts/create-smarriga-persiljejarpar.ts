import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 120, protein: 21, carbs: 0, fat: 4 },
  'Kalkonbacon': { calories: 130, protein: 19, carbs: 1, fat: 5 },
  'Pasta': { calories: 371, protein: 13, carbs: 75, fat: 1.5 },
  'Grönsaker': { calories: 35, protein: 2, carbs: 7, fat: 0.3 },
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
  console.log('🌿 Creating Smarriga Persiljejärpar recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const pasta = await findOrCreateFoodItem('Pasta')
  const gronsaker = await findOrCreateFoodItem('Grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Smarriga Persiljejärpar',
      description: 'Persiljejärpar gjorda på kycklingfärs och kalkonbacon, enkelt och smakrikt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/yNdBBfWd/2025-11-15-12-59-58-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
            amount: 91,
            displayAmount: '91',
            displayUnit: 'g',
          },
          {
            foodItemId: kalkonbacon.id,
            amount: 91,
            displayAmount: '91',
            displayUnit: 'g',
          },
          {
            foodItemId: pasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Finhacka kalkonbacon, blanda samman med kycklingfärs, persiljan samt vit&svartpeppar.',
          },
          {
            stepNumber: 2,
            instruction: 'Rulla färsen till biffar och stek gyllenbruna. Smaklig måltid!',
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
