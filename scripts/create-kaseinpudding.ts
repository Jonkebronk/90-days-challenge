import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon/blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Tyngre kasein kladdkaka': { calories: 385, protein: 80, carbs: 8, fat: 3 },
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
  console.log('🍮 Creating Kaseinpudding recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const hallonBlabar = await findOrCreateFoodItem('Hallon/blåbär')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const kasein = await findOrCreateFoodItem('Tyngre kasein kladdkaka')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kaseinpudding',
      description: 'Gott mellanmål som passar bra innan läggdags.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/JnLPrbvy/2025-11-14-12-30-09-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 114,
      proteinPerServing: 19,
      carbsPerServing: 5,
      fatPerServing: 2,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallonBlabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 31,
            displayAmount: '31',
            displayUnit: 'g',
          },
          {
            foodItemId: kasein.id,
            amount: 19,
            displayAmount: '19',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Vispa kaseinpulver med vatten till slät puddingkonsistens',
          },
          {
            stepNumber: 2,
            instruction: 'Häll upp i ett glas och ställ i frysen i 20 minuter eller kylen i 40 minuter',
          },
          {
            stepNumber: 3,
            instruction: 'Toppa med vaniljkvarg och halvtinade hallon/blåbår',
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
