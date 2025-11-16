import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Frysta hallon': { calories: 52, protein: 1.2, carbs: 12, fat: 0.6 },
  'Arla vanilj kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Steviadroppar hallon': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥤 Creating Frukostsmoothie - Allt i ett recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const frystaHallon = await findOrCreateFoodItem('Frysta hallon')
  const arlaVaniljKvarg = await findOrCreateFoodItem('Arla vanilj kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const steviadropparHallon = await findOrCreateFoodItem('Steviadroppar hallon')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostsmoothie - Allt i ett',
      description: 'En frukostsmoothie med allt i ett.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/8CybLq0j/2025-11-14-12-10-13-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: frystaHallon.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: arlaVaniljKvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 200, // 2 dl = 200ml
            displayAmount: '2',
            displayUnit: 'dl',
          },
          {
            foodItemId: steviadropparHallon.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynen med vatten i en blender',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa sedan tillsammans med kvarg och frysta hallon',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt några droppar stevia med hallonsmak',
          },
          {
            stepNumber: 4,
            instruction: 'Avnjut gärna val kyld!',
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
