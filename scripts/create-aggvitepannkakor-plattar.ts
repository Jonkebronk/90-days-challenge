import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Äggvita': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
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
  console.log('🥞 Creating Äggvitepannkakor/ plättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const aggvita = await findOrCreateFoodItem('Äggvita')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const rismjol = await findOrCreateFoodItem('Rismjöl')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Äggvitepannkakor/ plättar',
      description: 'Enkellt, snabbt och endast 2st (alt 3 ingredienser)',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/R0C2dLsG/2025-11-14-11-08-19-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 290,
      proteinPerServing: 29,
      carbsPerServing: 31,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: aggvita.id,
            amount: 247,
            displayAmount: '247',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 36,
            displayAmount: '36',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 12,
            displayAmount: '12',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Vispa ihop samtliga ingredienser. (Vill du ej anvands rismjöl, öka mängden havremjöl. Jag tycket de blir luftigare med lite rismjöl i)',
          },
          {
            stepNumber: 2,
            instruction: 'Stek på medelhög värme, ett par min per sida. Jag använder teflonpanna. Behlover inte kokosolja att steka i, men har du en annan panna kanske det kan behövas.',
          },
          {
            stepNumber: 3,
            instruction: 'Godast att äta direkt :)',
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
