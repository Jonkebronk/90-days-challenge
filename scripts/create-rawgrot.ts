import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Bär, färska eller frysta': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel, mald': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Ingefära, mald': { calories: 335, protein: 9, carbs: 72, fat: 4.2 },
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
  console.log('🥣 Creating Rawgröt recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const bar = await findOrCreateFoodItem('Bär, färska eller frysta')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const kanel = await findOrCreateFoodItem('Kanel, mald')
  const ingefara = await findOrCreateFoodItem('Ingefära, mald')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Rawgröt',
      description: 'En kall rawgröt smaksatt med kanel, ingefära och valfria bär.',
      categoryId: category.id,
      servings: 1,
      coverImage: '',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: bar.id,
            amount: 40,
            displayAmount: '40',
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
          {
            foodItemId: vatten.id,
            amount: 150, // 1.5 dl = 150ml
            displayAmount: '1.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: kanel.id,
            amount: 0.5, // 0.5 krm ≈ 0.5g
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
          {
            foodItemId: ingefara.id,
            amount: 0.5, // 0.5 krm ≈ 0.5g
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Förbered dagen innan du ska äta. Minst 12 timmar innan.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda havregryn med kanel och ingefära.',
          },
          {
            stepNumber: 3,
            instruction: 'Häll på vatten. Rör ordentligt.',
          },
          {
            stepNumber: 4,
            instruction: 'Blanda till sist i ditt val av bär. Plasta eller lägg på lock och ställ i kylen över natt.',
          },
          {
            stepNumber: 5,
            instruction: 'Dagen efter så rör du runt så bären mosas lite. Servera med kvarg.',
          },
          {
            stepNumber: 6,
            instruction: 'Tips! Gör flera små burkar eller en större sats rawgröt som du tar av varje morgon. Gröten håller sig bra i 4 dagar.',
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
