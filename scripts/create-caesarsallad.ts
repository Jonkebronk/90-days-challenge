import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Kalkonbacon': { calories: 130, protein: 19, carbs: 1, fat: 5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Sallad': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  'Slender chef Caesardressing': { calories: 50, protein: 1, carbs: 3, fat: 4 },
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
  console.log('🥗 Creating Caesarsallad recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfile = await findOrCreateFoodItem('Kycklingfilé')
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const potatis = await findOrCreateFoodItem('Potatis')
  const sallad = await findOrCreateFoodItem('Sallad')
  const caesardressing = await findOrCreateFoodItem('Slender chef Caesardressing')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Caesarsallad',
      description: 'Enkel och mättande sallad med härlig sälta.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/j2DMv7gt/2025-11-15-12-48-27-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfile.id,
            amount: 121,
            displayAmount: '121',
            displayUnit: 'g',
          },
          {
            foodItemId: kalkonbacon.id,
            amount: 61,
            displayAmount: '61',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: sallad.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: caesardressing.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Värm ugnen till 220 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Skär kycklingfileerna i passande bitar (ju mindre desto snabbare tillagning). Lägg kycklingen på ett bakplåtspapper och krydda med örtsalt, svartpeppar samt torkad timjan. In i ugnen till kycklingen är genomstekt.',
          },
          {
            stepNumber: 3,
            instruction: 'Stek kalkonbacon så den blir välstekt. Lägg på en bit hushållspapper för att rinna av överbllivet fett.',
          },
          {
            stepNumber: 4,
            instruction: 'Hacka valfri mängd sallad.',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg kycklingbitarna och kalkonbacon på salladen. Ringla över Caesardressingen från Slender chef.',
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
