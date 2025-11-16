import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Hallon': { calories: 52, protein: 1.2, carbs: 12, fat: 0.6 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Vaniljkvargplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const hallon = await findOrCreateFoodItem('Hallon')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Vaniljkvargplättar',
      description: 'Lätt att göra och supergott!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/pT6qMgfD/2025-11-14-12-17-19-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 490,
      proteinPerServing: 40,
      carbsPerServing: 37,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: hallon.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
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
            amount: 45, // 3 msk ≈ 45ml
            displayAmount: '3',
            displayUnit: 'msk',
          },
          {
            foodItemId: sotstro.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kanel.id,
            amount: 10, // 2 tsk
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kardemumma.id,
            amount: 5, // 1 tsk
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregryn till ett "mjöl"',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt ägg, Kvarg, vatten, kanel och kardemumma',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda ihop till en slät smet',
          },
          {
            stepNumber: 4,
            instruction: 'Låt stå i kylen ca 30min för en lite tjockare smet (lättare att steka)',
          },
          {
            stepNumber: 5,
            instruction: 'Stek i kokosolja',
          },
          {
            stepNumber: 6,
            instruction: 'Värm Hallon i mikron',
          },
          {
            stepNumber: 7,
            instruction: 'Tillsätt sötströ och blanda till en sylt',
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
