import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Okokt ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Vitkål': { calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
  'Findus wokmix': { calories: 35, protein: 2, carbs: 7, fat: 0.2 },
  'Curry': { calories: 325, protein: 14, carbs: 55, fat: 14 },
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
  console.log('🍛 Creating Kyckling wok recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const okoktRis = await findOrCreateFoodItem('Okokt ris')
  const vitkal = await findOrCreateFoodItem('Vitkål')
  const wokmix = await findOrCreateFoodItem('Findus wokmix')
  const curry = await findOrCreateFoodItem('Curry')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kyckling',
      description: 'En härlig wok med kyckling, ris och curry. Perfekt för matlådor och storkok.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/gkbbTcWs/2025-11-15-13-23-50-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: okoktRis.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: vitkal.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: wokmix.id,
            amount: 175,
            displayAmount: '175',
            displayUnit: 'g',
          },
          {
            foodItemId: curry.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka riset',
          },
          {
            stepNumber: 2,
            instruction: 'Stek kycklingen',
          },
          {
            stepNumber: 3,
            instruction: 'Skrimla vitkål (om du vill ha det)',
          },
          {
            stepNumber: 4,
            instruction: 'Ta fram wokmix',
          },
          {
            stepNumber: 5,
            instruction: 'När riset kokat klart lägger du alla ingredienser i stekpannan',
          },
          {
            stepNumber: 6,
            instruction: 'Stek tills de fått en fin färg',
          },
          {
            stepNumber: 7,
            instruction: 'Krydda med curry i din smak',
          },
          {
            stepNumber: 8,
            instruction: 'Häll på lite vatten så allt går ihop med kryddan',
          },
          {
            stepNumber: 9,
            instruction: 'Klart att äta',
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
