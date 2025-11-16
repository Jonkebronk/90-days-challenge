import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Proteinpulver vanilj': { calories: 380, protein: 80, carbs: 8, fat: 5 },
  'Arla mild kvarg vanilj': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Ica sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
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
  console.log('🍞 Creating Ebbas Lussebröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver vanilj')
  const kvarg = await findOrCreateFoodItem('Arla mild kvarg vanilj')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const sotstro = await findOrCreateFoodItem('Ica sötströ')
  const saffran = await findOrCreateFoodItem('Saffran')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ebbas Lussebröd',
      description: 'Lussebröd av kvarg med saffran och vaniljsmak. Perfekt som fika i juletider.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/yNdPJg56/2025-11-14-10-24-26-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 476,
      proteinPerServing: 41,
      carbsPerServing: 33,
      fatPerServing: 19,
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
            foodItemId: proteinpulver.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 73,
            displayAmount: '73',
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
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: saffran.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa eller ha i havregrynen som de är',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda i alla ingredienser',
          },
          {
            stepNumber: 3,
            instruction: 'Klicka ut på en plåt med bakplåtspapper, gör inte broden för tunna då de lätt blir torra',
          },
          {
            stepNumber: 4,
            instruction: 'Grädda i 10-13 minuter på 200 grader eller tills de fått fin färg',
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
