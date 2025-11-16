import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Frusna bär (valfria)': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Proteinpulver': { calories: 400, protein: 80, carbs: 10, fat: 5 },
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
  console.log('🍨 Creating Proteinfluff med frusna bär recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const frusnaBar = await findOrCreateFoodItem('Frusna bär (valfria)')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Proteinfluff med frusna bär',
      description: 'Valfritt proteinpulver (vanilj/choklad rekommenderas) vispas med en skvät vatten och frusna bär.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/252VyYXK/2025-11-14-12-32-40-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 110,
      proteinPerServing: 19,
      carbsPerServing: 3,
      fatPerServing: 2,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: frusnaBar.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
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
            instruction: 'Vispa alla ingredienser i ca. 3 minuter.',
          },
          {
            stepNumber: 2,
            instruction: 'Häll över i ett trevligt serveringsglas och toppa med några frusna bär som sparats vid sidan om.',
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
