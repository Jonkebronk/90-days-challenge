import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kokos kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Hallon kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Yoggi Samoa': { calories: 56, protein: 10, carbs: 4.5, fat: 0.1 },
  'Frysta hallon': { calories: 53, protein: 1.2, carbs: 12, fat: 0.3 },
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
  console.log('🥤 Creating Tropisk smoothie recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const kokoskvarg = await findOrCreateFoodItem('Kokos kvarg')
  const hallonkvarg = await findOrCreateFoodItem('Hallon kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const yoggisamoa = await findOrCreateFoodItem('Yoggi Samoa')
  const frystahallon = await findOrCreateFoodItem('Frysta hallon')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Tropisk smoothie',
      description: 'Smakrik och mättande smoothie',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/GmNd4Nhh/2025-11-14-11-24-38-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 289,
      proteinPerServing: 29,
      carbsPerServing: 31,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kokoskvarg.id,
            amount: 76,
            displayAmount: '76',
            displayUnit: 'g',
          },
          {
            foodItemId: hallonkvarg.id,
            amount: 76,
            displayAmount: '76',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 24,
            displayAmount: '24',
            displayUnit: 'g',
          },
          {
            foodItemId: yoggisamoa.id,
            amount: 202,
            displayAmount: '202',
            displayUnit: 'g',
          },
          {
            foodItemId: frystahallon.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda allt i mixer alt. med stavmixer',
          },
          {
            stepNumber: 2,
            instruction: 'Servera direkt. val kyld av dom frysta hallonen.',
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
