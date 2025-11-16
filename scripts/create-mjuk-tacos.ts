import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mager nötfärs': { calories: 151, protein: 20, carbs: 0, fat: 7.5 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Paprikapulver': { calories: 282, protein: 14, carbs: 54, fat: 13 },
  'Vitlökspulver': { calories: 331, protein: 17, carbs: 72, fat: 0.7 },
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
  console.log('🌮 Creating Mjuk Tacos recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Mager nötfärs')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const paprika = await findOrCreateFoodItem('Paprikapulver')
  const vitlok = await findOrCreateFoodItem('Vitlökspulver')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Mjuk Tacos',
      description: 'Om man saknar taco kvällar med mjukt bröd är detta lösningen!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/zB8PF4NR/2025-11-15-11-55-00-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 440,
      proteinPerServing: 38,
      carbsPerServing: 54,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 152,
            displayAmount: '152',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 75, // 0.75 dl ≈ 75ml/g
            displayAmount: '0.75',
            displayUnit: 'dl',
          },
          {
            foodItemId: paprika.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vitlok.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
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
            instruction: 'Sätt ugnen på 225 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda rismjöl och vatten',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda i valfria kryddor',
          },
          {
            stepNumber: 4,
            instruction: 'Placera ett större bröd eller två mindre på plåt med bakplåtspapper',
          },
          {
            stepNumber: 5,
            instruction: 'In i ugnen i 5 minuter, låt svalna en aning på bakplåtspappret',
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
