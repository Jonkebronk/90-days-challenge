import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Torkade tranbär': { calories: 308, protein: 0.1, carbs: 82.4, fat: 1.4 },
  'Solroskärnor': { calories: 584, protein: 20.8, carbs: 20, fat: 51.5 },
  'Naturell kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sesamfrön till topping': { calories: 573, protein: 17.7, carbs: 23.4, fat: 49.7 },
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
  console.log('🍞 Creating Tranbärsbröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const torkadetranbar = await findOrCreateFoodItem('Torkade tranbär')
  const solroskarnor = await findOrCreateFoodItem('Solroskärnor')
  const naturellkvarg = await findOrCreateFoodItem('Naturell kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const salt = await findOrCreateFoodItem('Salt')
  const sesamfron = await findOrCreateFoodItem('Sesamfrön till topping')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Tranbärsbröd',
      description: 'Tranbärsbröd gjort på havregryn och kvarg',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/RZhrmRmL/2025-11-14-10-57-49-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 479,
      proteinPerServing: 38,
      carbsPerServing: 38,
      fatPerServing: 19,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 99,
            displayAmount: '99',
            displayUnit: 'g',
          },
          {
            foodItemId: torkadetranbar.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: solroskarnor.id,
            amount: 8,
            displayAmount: '8',
            displayUnit: 'g',
          },
          {
            foodItemId: naturellkvarg.id,
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
            foodItemId: bakpulver.id,
            amount: 2.5, // 0.5 tsk ≈ 2.5g
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: salt.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sesamfron.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 250 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ihop alla ingredienser i en skål och låt stå ca 10 min.',
          },
          {
            stepNumber: 3,
            instruction: 'Klicka ut 8 hogar på en plåt och forma till bollar.',
          },
          {
            stepNumber: 4,
            instruction: 'Strö över sesamfrön som topping.',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda mitt i ugnen i ca 15 min.',
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
