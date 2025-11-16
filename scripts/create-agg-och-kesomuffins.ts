import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Kalkon': { calories: 135, protein: 29, carbs: 0, fat: 2 },
  'Keso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Spenat': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  'Oregano': { calories: 265, protein: 9, carbs: 69, fat: 4.3 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Peppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
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
  console.log('🧁 Creating Ägg- och kesomuffins recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kalkon = await findOrCreateFoodItem('Kalkon')
  const keso = await findOrCreateFoodItem('Keso')
  const spenat = await findOrCreateFoodItem('Spenat')
  const oregano = await findOrCreateFoodItem('Oregano')
  const salt = await findOrCreateFoodItem('Salt')
  const peppar = await findOrCreateFoodItem('Peppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ägg- och kesomuffins',
      description: 'Ägg-och kesomuffins med kalkon och oregano. Perfekt mellanmål.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/fLrtH5wk/2025-11-14-11-02-49-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 303,
      proteinPerServing: 37,
      carbsPerServing: 5,
      fatPerServing: 15,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: kalkon.id,
            amount: 28,
            displayAmount: '28',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 112,
            displayAmount: '112',
            displayUnit: 'g',
          },
          {
            foodItemId: spenat.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: oregano.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: salt.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: peppar.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda 1 ägg med, keso och spenat (tinad fryst går bra). Lägg kalkonskivor i muffinsform och häll i ägg/keso smeten. Krydda med salt, peppar och oregano :) graddas i ugnen på 200 grader i 20 min.',
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
