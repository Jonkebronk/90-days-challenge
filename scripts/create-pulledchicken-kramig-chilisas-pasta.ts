import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Kvarg': { calories: 68, protein: 11, carbs: 4, fat: 0.2 },
  'Pasta': { calories: 371, protein: 13, carbs: 75, fat: 1.5 },
  'Sweet Chili Sås': { calories: 120, protein: 0, carbs: 30, fat: 0 },
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
  console.log('🍝 Creating Pulledchicken i krämig chilisås med pasta recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const pasta = await findOrCreateFoodItem('Pasta')
  const sweetchili = await findOrCreateFoodItem('Sweet Chili Sås')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Pulledchicken i krämig chilisås med pasta',
      description: 'Krämig och god pulledchicken med pasta',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/hGrhYq9p/2025-11-15-10-38-03-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 440,
      proteinPerServing: 46,
      carbsPerServing: 55,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 154,
            displayAmount: '154',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: pasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: sweetchili.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
            notes: 'Slender Chef Sweet Chili'
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
            instruction: 'Koka kycklingen i ca 40 min.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda kvarg med alla kryddor och Slender chef sweet chili. Smaka av efter önskad smak.',
          },
          {
            stepNumber: 3,
            instruction: 'Koka pasta (vilken sort du vill ha)',
          },
          {
            stepNumber: 4,
            instruction: 'Häll av vattnet från pastan och släng i kvargblandningen och rör runt. Låt stå och gotta sig med locket på.',
          },
          {
            stepNumber: 5,
            instruction: 'Häll av vattnet från kycklingen och dra isär det.',
          },
          {
            stepNumber: 6,
            instruction: 'Sen häller du i kycklingen med pastan och blandar runt. Det är gott att hälla på lite chiliflakes i efterhand.',
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
