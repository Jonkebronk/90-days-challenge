import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Superminikeso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Fiberhavregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🍞 Creating Kesobröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const superminikeso = await findOrCreateFoodItem('Superminikeso')
  const fiberhavregryn = await findOrCreateFoodItem('Fiberhavregryn')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kesobröd',
      description: 'Bröd med endast två ingredienser. Keson ger brödet ostsmak!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/cLGvvr9g/2025-11-14-11-21-18-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 291,
      proteinPerServing: 24,
      carbsPerServing: 34,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: superminikeso.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: fiberhavregryn.id,
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
            instruction: 'Blanda havregryn och keso, mosa ihop till en kramig deg',
          },
          {
            stepNumber: 2,
            instruction: 'Grädda i mitten av ugnen på 200 grader i 20 minuter, låt sedan stå kvar på eftervärme i 10 minuter.',
          },
          {
            stepNumber: 3,
            instruction: 'Låt svalna och ät med exempelvis ett kokt skivat ägg eller stekt ägg.',
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
