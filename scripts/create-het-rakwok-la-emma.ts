import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Färdigskalade räkor': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  'Jasminis': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Wokgrönsaker': { calories: 35, protein: 2, carbs: 7, fat: 0.3 },
  'Slender chefs sweet chili': { calories: 20, protein: 0.3, carbs: 4.5, fat: 0.1 },
  'Fryst persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
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
  console.log('🦐 Creating Het räkwok la Emma recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Färdigskalade räkor')
  const jasminis = await findOrCreateFoodItem('Jasminis')
  const wokgronsaker = await findOrCreateFoodItem('Wokgrönsaker')
  const sweetChili = await findOrCreateFoodItem('Slender chefs sweet chili')
  const persilja = await findOrCreateFoodItem('Fryst persilja')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Het räkwok la Emma',
      description: 'En smaskig räkwok med hetta',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/kgGgsX9V/2025-11-15-12-44-00-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 53,
      carbsPerServing: 60,
      fatPerServing: 3,
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
            foodItemId: jasminis.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: wokgronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: sweetChili.id,
            amount: 45,
            displayAmount: '3',
            displayUnit: 'msk',
            notes: 'cirka 45ml',
          },
          {
            foodItemId: persilja.id,
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
            instruction: 'Koka riset all dente för bästa smakupplevelse.',
          },
          {
            stepNumber: 2,
            instruction: 'Stek wokgrönsakerna i kokosoljan i en stekpanna',
          },
          {
            stepNumber: 3,
            instruction: 'Häll i riset i pannan när det är klart och blanda runt',
          },
          {
            stepNumber: 4,
            instruction: 'Ha i peppar, Sweet chili och fryst persilja',
          },
          {
            stepNumber: 5,
            instruction: 'När du har smakat av så häller du i räkorna. Räkorna ska bara bli varma.',
          },
          {
            stepNumber: 6,
            instruction: 'Servera med extra fryst persilja på toppen och njut!',
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
