import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 120, protein: 21, carbs: 0, fat: 4 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Ägg': { calories: 143, protein: 13, carbs: 0.6, fat: 10 },
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
  console.log('🍗 Creating Kycklingbiffar recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const ris = await findOrCreateFoodItem('Ris')
  const agg = await findOrCreateFoodItem('Ägg')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kycklingbiffar',
      description: 'Goda saftiga biffar gjorda på kycklingfärs',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/JnLypVp8/2025-11-15-12-54-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 47,
      carbsPerServing: 54,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 68,
            displayAmount: '68',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Finhacka löken och stek tillsammans med kryddorna, det ska vara mycket av Basilika och Persilja.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ihop Kyrkingfärsen och ägget',
          },
          {
            stepNumber: 3,
            instruction: 'Häll i lök landningen, blanda ihop allt väl och forma sedan till biffar. 2 st per portion',
          },
          {
            stepNumber: 4,
            instruction: 'Jag gjorde 6 portioner med 1 ägg, så på 1 portion så kan man nog utesluta ägget',
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
