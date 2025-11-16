import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingkebab': { calories: 150, protein: 20, carbs: 3, fat: 6 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Sparris': { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Spetskål': { calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Tomat': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Rivet citronskal': { calories: 47, protein: 1.5, carbs: 16, fat: 0.3 },
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
  console.log('🍋 Creating Kycklingkebab med sparris och citron recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingkebab = await findOrCreateFoodItem('Kycklingkebab')
  const ris = await findOrCreateFoodItem('Ris')
  const sparris = await findOrCreateFoodItem('Sparris')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const spetskal = await findOrCreateFoodItem('Spetskål')
  const paprika = await findOrCreateFoodItem('Paprika')
  const tomat = await findOrCreateFoodItem('Tomat')
  const citronskal = await findOrCreateFoodItem('Rivet citronskal')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kycklingkebab med sparris och citron',
      description: 'Fräsch kycklingkebab med sparris och rivet citronskal. Går snabbt att laga!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/BQgd6xrD/2025-11-15-13-01-27-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingkebab.id,
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
            foodItemId: sparris.id,
            amount: 61,
            displayAmount: '61',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
          },
          {
            foodItemId: spetskal.id,
            amount: 36,
            displayAmount: '36',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 24,
            displayAmount: '24',
            displayUnit: 'g',
          },
          {
            foodItemId: tomat.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: citronskal.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
            notes: 'gärna eko',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skölj och koka riset',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka alla grönsaker i mindre bitar',
          },
          {
            stepNumber: 3,
            instruction: 'Stek grönsakerna ca 10 min på medelhög värme, det ska bli mjuka och få lite yta',
          },
          {
            stepNumber: 4,
            instruction: 'Krydda grönsakerna med salt, peppar och spiskummin.',
          },
          {
            stepNumber: 5,
            instruction: 'Tvätta citronen, riv sedan citronskalet över grönsakerna.',
          },
          {
            stepNumber: 6,
            instruction: 'Samtidigt som du steker grönsakerna steker du kycklingkebaben på medelhog värme i ca 10min (följa anvisningen på förpackningen)',
          },
          {
            stepNumber: 7,
            instruction: 'Smaka av och krydda efter behov!',
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
