import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Bisbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🥣 Creating Overnight oats med bär och kvarg recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hallon = await findOrCreateFoodItem('Hallon')
  const bisbar = await findOrCreateFoodItem('Bisbär')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Overnight oats med bär och kvarg',
      description: 'En enkel och god frukost.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/fTNJq4MC/2025-11-14-10-17-51-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallon.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: bisbar.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mät upp havregrynen i en burk',
          },
          {
            stepNumber: 2,
            instruction: 'Häll på vatten så att det blötlägger havregrynen',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg i baren ovenpå',
          },
          {
            stepNumber: 4,
            instruction: 'Sätt på lock och ställ in i kylen över natten',
          },
          {
            stepNumber: 5,
            instruction: 'På morgonen lägger du på kvargern och toppar med lite kanel. Mums!',
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
