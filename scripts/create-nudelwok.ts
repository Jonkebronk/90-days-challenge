import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Noble kyckling i tomatsås': { calories: 110, protein: 20, carbs: 5, fat: 2 },
  'Risnudlar': { calories: 109, protein: 0.9, carbs: 25, fat: 0.1 },
  'Champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Salladslök': { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2 },
  'Pak Choi': { calories: 13, protein: 1.5, carbs: 2.2, fat: 0.2 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
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
  console.log('🍜 Creating Nudelwok recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Noble kyckling i tomatsås')
  const risnudlar = await findOrCreateFoodItem('Risnudlar')
  const champinjoner = await findOrCreateFoodItem('Champinjoner')
  const salladslok = await findOrCreateFoodItem('Salladslök')
  const pakchoi = await findOrCreateFoodItem('Pak Choi')
  const paprika = await findOrCreateFoodItem('Paprika')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Nudelwok',
      description: 'Enkelt, snabbt och gott!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/63xg8yTN/2025-11-15-12-11-17-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: risnudlar.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
          },
          {
            foodItemId: salladslok.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: pakchoi.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Hacka grönsakerna och stek i lite olja en stund.',
          },
          {
            stepNumber: 2,
            instruction: 'Koka nudlarna och ställ åt sidan.',
          },
          {
            stepNumber: 3,
            instruction: 'När grönsakerna mjuknat lite, tillsätt kycklingen med sås.',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg i nudlarna, krydda och låt puttra ihop en stund.',
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
