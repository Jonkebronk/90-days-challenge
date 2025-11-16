import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Lax': { calories: 208, protein: 20, carbs: 0, fat: 13.4 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Grönsaker': { calories: 35, protein: 2, carbs: 7, fat: 0.3 },
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
  console.log('🐟 Creating Potatismos med ugnsbakad lax recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const lax = await findOrCreateFoodItem('Lax')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gronsaker = await findOrCreateFoodItem('Grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Potatismos med ugnsbakad lax',
      description: 'Husmanskost!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/jjRRDx5H/2025-11-15-12-30-32-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 509,
      proteinPerServing: 32,
      carbsPerServing: 58,
      fatPerServing: 13,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: lax.id,
            amount: 104,
            displayAmount: '104',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka potatisen med lite dill.',
          },
          {
            stepNumber: 2,
            instruction: 'Sätt på ugnen, grad rad beroende på laxen är tinad eller fryst.',
          },
          {
            stepNumber: 3,
            instruction: 'Krydda laxen med förslagsvis peppar, vitlökspulver, cayennepeppar och citron.',
          },
          {
            stepNumber: 4,
            instruction: 'När potatisen är klar (koka hellre längre än för kort) så sparar du lite av kokvattnet, mosar och vispar med elvisp. Addera gärna mer dill och andra valfria kryddor.',
          },
          {
            stepNumber: 5,
            instruction: 'Gör iordning valfria grönsaker.',
          },
          {
            stepNumber: 6,
            instruction: 'Smaklig måltid!',
          },
          {
            stepNumber: 7,
            instruction: 'Tips! Jag skalar ei potatisen, finns bra närings i skalet och det blir lite tugmotstånd, utöver att det är gott.',
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
