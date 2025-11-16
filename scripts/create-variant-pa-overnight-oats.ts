import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Chiafrön': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  'Hallon/blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg hallon/blåbär/Vanilj': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Yoggi mini blåbär/hallon/vanilj/samoa': { calories: 68, protein: 9.6, carbs: 4.4, fat: 1.5 },
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
  console.log('🥣 Creating Variant på overnight oats recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const chiafron = await findOrCreateFoodItem('Chiafrön')
  const hallonBlabar = await findOrCreateFoodItem('Hallon/blåbär')
  const kvarg = await findOrCreateFoodItem('Kvarg hallon/blåbär/Vanilj')
  const yoggiMini = await findOrCreateFoodItem('Yoggi mini blåbär/hallon/vanilj/samoa')
  const havregryn = await findOrCreateFoodItem('Havregryn')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Variant på overnight oats',
      description: 'Supergod och krämig variant på overnight oats',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/ZnqtwtTs/2025-11-14-12-14-48-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 490,
      proteinPerServing: 36,
      carbsPerServing: 50,
      fatPerServing: 16,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: chiafron.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: hallonBlabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: yoggiMini.id,
            amount: 199,
            displayAmount: '199',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Väg upp yoghurt, kvarg, havregryn i en burk med lock',
          },
          {
            stepNumber: 2,
            instruction: 'Addera chiafrön',
          },
          {
            stepNumber: 3,
            instruction: 'Addera dina bär',
          },
          {
            stepNumber: 4,
            instruction: 'Rör ihop och låt stå över natten',
          },
          {
            stepNumber: 5,
            instruction: 'Toppa med nötter eller valfritt nötsmör',
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
