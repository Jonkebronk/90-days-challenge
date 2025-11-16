import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kalkonbacon': { calories: 149, protein: 21.5, carbs: 1, fat: 6 },
  'Supermini keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Kikärtspasta': { calories: 337, protein: 17, carbs: 54, fat: 4.6 },
  'Äggula': { calories: 322, protein: 16, carbs: 3.6, fat: 27 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
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
  console.log('🍝 Creating Thildas Carbonara - grundrecept recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const keso = await findOrCreateFoodItem('Supermini keso')
  const pasta = await findOrCreateFoodItem('Kikärtspasta')
  const aggula = await findOrCreateFoodItem('Äggula')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Thildas Carbonara - grundrecept',
      description: 'grundreceptet för carbonaran alla pratar om!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/ZRKFBht2/2025-11-14-14-30-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 45,
      carbsPerServing: 56,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kalkonbacon.id,
            amount: 134,
            displayAmount: '134',
            displayUnit: 'g',
            notes: 'Kyckling/kalkonbacon'
          },
          {
            foodItemId: keso.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: pasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
            notes: 'Risentas kikärtspasta'
          },
          {
            foodItemId: aggula.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål'
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
            notes: 'Att äta utöver receptet (för en komplett lunch)'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'stek bacon (eller annat protein)',
          },
          {
            stepNumber: 2,
            instruction: 'koka upp pastan',
          },
          {
            stepNumber: 3,
            instruction: 'blanda i baconen med pastan',
          },
          {
            stepNumber: 4,
            instruction: 'tillsätt keson och låt allt smälta samman',
          },
          {
            stepNumber: 5,
            instruction: 'krydda efter tycke och smak (vitpeppar, cayenne)',
          },
          {
            stepNumber: 6,
            instruction: 'toppa med en äggula',
          },
          {
            stepNumber: 7,
            instruction: 'servera med sallad, lycka till!',
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
