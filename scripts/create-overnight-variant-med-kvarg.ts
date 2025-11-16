import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Linfrön': { calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2 },
  'Chiafrön': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  'Blåbär (eller andra bär)': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn med fiber': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🥣 Creating Overnight-variant med kvarg recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const linfron = await findOrCreateFoodItem('Linfrön')
  const chiafron = await findOrCreateFoodItem('Chiafrön')
  const blabar = await findOrCreateFoodItem('Blåbär (eller andra bär)')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn med fiber')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Overnight-variant med kvarg',
      description: 'Variant på overnight oats.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/1RptL9RW/2025-11-14-11-23-30-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 476,
      proteinPerServing: 30,
      carbsPerServing: 51,
      fatPerServing: 16,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: linfron.id,
            amount: 30, // 2 msk ≈ 30g
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: chiafron.id,
            amount: 35,
            displayAmount: '35',
            displayUnit: 'g',
          },
          {
            foodItemId: blabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
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
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda fiberhavregryn, linfrön och chiafrön',
          },
          {
            stepNumber: 2,
            instruction: 'Fyll upp med vatten precis över blandningen',
          },
          {
            stepNumber: 3,
            instruction: 'Låt stå över natten (eller åtminstone ett par timmar) i kylen',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg på bär och fyll upp med vaniljkvargen',
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
