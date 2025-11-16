import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingbacon': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Bönpasta spagetti': { calories: 348, protein: 42, carbs: 35, fat: 3.5 },
  'Gul eller röd lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Grönkål': { calories: 49, protein: 4.3, carbs: 9, fat: 0.9 },
  'Färska champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Vitlöksklyfta': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🍝 Creating Pasta med grönkål och bacon recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingbacon = await findOrCreateFoodItem('Kycklingbacon')
  const bonpasta = await findOrCreateFoodItem('Bönpasta spagetti')
  const lok = await findOrCreateFoodItem('Gul eller röd lök')
  const gronkal = await findOrCreateFoodItem('Grönkål')
  const champinjoner = await findOrCreateFoodItem('Färska champinjoner')
  const vitlok = await findOrCreateFoodItem('Vitlöksklyfta')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Pasta med grönkål och bacon',
      description: 'En enkel och snabb men framförallt god måltid.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/d1R3zkzM/2025-11-15-11-59-58-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingbacon.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: bonpasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: gronkal.id,
            amount: 95,
            displayAmount: '95',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka bönpagettin',
          },
          {
            stepNumber: 2,
            instruction: 'Häll av spagettin och skär upp den i mindre bitar',
          },
          {
            stepNumber: 3,
            instruction: 'Pressa i vitlök och salta om så önskas',
          },
          {
            stepNumber: 4,
            instruction: 'Hacka grönkål och stek tillsammans med tidigare ingredienser',
          },
          {
            stepNumber: 5,
            instruction: 'Skiva bacon i strimlor, hacka lök och skiva champinjoner. Stek detta tillsammans.',
          },
          {
            stepNumber: 6,
            instruction: 'Blanda baconröran med pasta.',
          },
          {
            stepNumber: 7,
            instruction: 'Ät och njut!',
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
