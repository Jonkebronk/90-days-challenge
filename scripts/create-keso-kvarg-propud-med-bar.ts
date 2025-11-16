import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Blåbär och hallonmix': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Vaniljkvarg utan tillsatt socker': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Cottage Cheese/Keso 1.5% fett': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Njie Propud protein pudding vanilj': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
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
  console.log('🥣 Creating Keso kvarg propud med bär recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const blabarHallonmix = await findOrCreateFoodItem('Blåbär och hallonmix')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg utan tillsatt socker')
  const cottageCheese = await findOrCreateFoodItem('Cottage Cheese/Keso 1.5% fett')
  const njiePropud = await findOrCreateFoodItem('Njie Propud protein pudding vanilj')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Keso kvarg propud med bär',
      description: 'Blanda ihop cottage cheese, njie propud vanilj och vaniljkvarg. Toppa med bär och ät.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/CxwvpHyx/2025-11-14-12-40-09-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 114,
      proteinPerServing: 17,
      carbsPerServing: 7,
      fatPerServing: 2,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: blabarHallonmix.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 44,
            displayAmount: '44',
            displayUnit: 'g',
          },
          {
            foodItemId: cottageCheese.id,
            amount: 44,
            displayAmount: '44',
            displayUnit: 'g',
          },
          {
            foodItemId: njiePropud.id,
            amount: 44,
            displayAmount: '44',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ihop allt och toppa med bär.',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg i bären precis innan det ska serveras och inte dagar i förväg.',
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
