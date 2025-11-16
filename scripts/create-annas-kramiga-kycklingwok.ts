import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Risnudlar': { calories: 364, protein: 3.4, carbs: 83, fat: 0.6 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Jordnötssmör, crunchy': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'Färskpressad Lime': { calories: 30, protein: 0.7, carbs: 11, fat: 0.2 },
  'Curry': { calories: 325, protein: 14, carbs: 55, fat: 14 },
  'Ingefära': { calories: 80, protein: 1.8, carbs: 18, fat: 0.8 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🥜 Creating Annas krämiga kycklingwok recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfile = await findOrCreateFoodItem('Kycklingfilé')
  const risnudlar = await findOrCreateFoodItem('Risnudlar')
  const paprika = await findOrCreateFoodItem('Paprika')
  const lok = await findOrCreateFoodItem('Lök')
  const jordnotssmor = await findOrCreateFoodItem('Jordnötssmör, crunchy')
  const lime = await findOrCreateFoodItem('Färskpressad Lime')
  const curry = await findOrCreateFoodItem('Curry')
  const ingefara = await findOrCreateFoodItem('Ingefära')
  const vitlok = await findOrCreateFoodItem('Vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Annas krämiga kycklingwok',
      description: 'God, krämig nudelrätt med smak av jordnötter, lime och ingefära.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/3RLQq23R/2025-11-15-13-21-31-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfile.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: risnudlar.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 125,
            displayAmount: '125',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: jordnotssmor.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål',
          },
          {
            foodItemId: lime.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
            notes: 'färskpressad',
          },
          {
            foodItemId: curry.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'krm',
          },
          {
            foodItemId: ingefara.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
            notes: 'färsk',
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
            instruction: 'Hacka kycklingen och grönsakerna i bitar.',
          },
          {
            stepNumber: 2,
            instruction: 'Krydda kycklingen med curry, chili, ingefära, vitlök och lite Herbamare.',
          },
          {
            stepNumber: 3,
            instruction: 'Stek kycklingen i lite kokosolja. Ställ åt sidan.',
          },
          {
            stepNumber: 4,
            instruction: 'Stek löken och paprikan.',
          },
          {
            stepNumber: 5,
            instruction: 'Koka risnudlarna.',
          },
          {
            stepNumber: 6,
            instruction: 'Blanda ihop kycklingen och grönsakerna.',
          },
          {
            stepNumber: 7,
            instruction: 'På med färsk ingefära, en massa färskpressad lime. Stek ihop.',
          },
          {
            stepNumber: 8,
            instruction: 'Klicka i jordnötssmör med kycklingen och grönsakerna (fettkälla från mellanmål) och häll i lite vatten, så det blir krämigt.',
          },
          {
            stepNumber: 9,
            instruction: 'Släng i nudlarna och lite extra färskpressad lime.',
          },
          {
            stepNumber: 10,
            instruction: 'Enjoy!',
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
