import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Räkor': { calories: 99, protein: 24, carbs: 0, fat: 1.4 },
  'Pasta': { calories: 131, protein: 5, carbs: 25, fat: 0.9 },
  'Färska champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Sparris': { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  'Körsbärstomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Vitlökspulver': { calories: 331, protein: 17, carbs: 73, fat: 0.7 },
  'Paprikakrydda': { calories: 282, protein: 14, carbs: 54, fat: 13 },
  'Herbamare örtsalt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🦐 Creating Räkpasta med sparris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Räkor')
  const pasta = await findOrCreateFoodItem('Pasta')
  const champinjoner = await findOrCreateFoodItem('Färska champinjoner')
  const sparris = await findOrCreateFoodItem('Sparris')
  const korsbarstomater = await findOrCreateFoodItem('Körsbärstomater')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const vitlokspulver = await findOrCreateFoodItem('Vitlökspulver')
  const paprikakrydda = await findOrCreateFoodItem('Paprikakrydda')
  const herbamare = await findOrCreateFoodItem('Herbamare örtsalt')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Räkpasta med sparris',
      description: 'En snabb pastarätt med räkor!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/FRHYMgXG/2025-11-15-13-06-57-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 49,
      carbsPerServing: 56,
      fatPerServing: 8,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: rakor.id,
            amount: 225,
            displayAmount: '225',
            displayUnit: 'g',
          },
          {
            foodItemId: pasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 8,
            displayAmount: '8',
            displayUnit: 'g',
          },
          {
            foodItemId: sparris.id,
            amount: 11,
            displayAmount: '11',
            displayUnit: 'g',
          },
          {
            foodItemId: korsbarstomater.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: vitlokspulver.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: paprikakrydda.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
            notes: 'hot!',
          },
          {
            foodItemId: herbamare.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka pastan till al dente. Häll bort nästan allt spad, behåll ca 2-3 msk och ställ åt sidan.',
          },
          {
            stepNumber: 2,
            instruction: 'Ta lite kokosolja i pannan, hetta upp kryddorna förutom Herbamare och lägg i champinjonerna. Låt dessa stekas nån minut medan du skär upp sparrisen.',
          },
          {
            stepNumber: 3,
            instruction: 'I med sparris och låt det stela med 2-3 minuter på hög värme',
          },
          {
            stepNumber: 4,
            instruction: 'Sist i med väl avrunna räkor, pasta, pastavattnet och hela eller delade cocktailtomater. Smaka av med ev mer kryddor och lite Herbamare örtsalt. Inte alltid salt behövs då lägen räkorna lägat i oftast är salt.',
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
