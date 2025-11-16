import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Lärsas grekiska yoghurt': { calories: 97, protein: 10, carbs: 4, fat: 5 },
  'Citronsaft': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
  'Äggula': { calories: 322, protein: 15.9, carbs: 3.6, fat: 26.5 },
  'Dragon': { calories: 295, protein: 22.8, carbs: 50.2, fat: 7.2 },
  'Persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
  'Lite salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vitpeppar': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥫 Creating Bearnaise recipe...\n')

  // Find Sås category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'sas' }
  })

  if (!category) {
    throw new Error('Sås category not found')
  }

  // Create or find all food items
  const grekiskYoghurt = await findOrCreateFoodItem('Lärsas grekiska yoghurt')
  const citronsaft = await findOrCreateFoodItem('Citronsaft')
  const aggula = await findOrCreateFoodItem('Äggula')
  const dragon = await findOrCreateFoodItem('Dragon')
  const persilja = await findOrCreateFoodItem('Persilja')
  const salt = await findOrCreateFoodItem('Lite salt')
  const vitpeppar = await findOrCreateFoodItem('Vitpeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Bearnaise',
      description: 'Kall bearnaise gjord på grekisk yoghurt',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/tgkGHCm9/2025-11-14-12-45-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 98,
      proteinPerServing: 17,
      carbsPerServing: 5,
      fatPerServing: 1,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: grekiskYoghurt.id,
            amount: 131,
            displayAmount: '131',
            displayUnit: 'g',
          },
          {
            foodItemId: citronsaft.id,
            amount: 2.5, // 0.5 msk ≈ 7.5ml, using 2.5g
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
          {
            foodItemId: aggula.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'st',
          },
          {
            foodItemId: dragon.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: persilja.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: salt.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: vitpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ihop ingredienserna och smaka av med kryddningen',
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
