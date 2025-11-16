import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Jordgubbskvarg (Arla)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bittermandelarom': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
  'Kokosflingor': { calories: 660, protein: 6, carbs: 7, fat: 65 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🧁 Creating Saffransmuffins recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const jordgubbskvarg = await findOrCreateFoodItem('Jordgubbskvarg (Arla)')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bittermandelarom = await findOrCreateFoodItem('Bittermandelarom')
  const saffran = await findOrCreateFoodItem('Saffran')
  const kokosflingor = await findOrCreateFoodItem('Kokosflingor')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffransmuffins',
      description: 'Super goda frukost-/mellismuffins med smak av saffran och mandel!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/j2bKdbj1/2025-11-14-10-37-30-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 40,
      carbsPerServing: 35,
      fatPerServing: 18,
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
            foodItemId: jordgubbskvarg.id,
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
            foodItemId: bittermandelarom.id,
            amount: 1, // 1 krm
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5, // 1 paket ≈ 0.5g
            displayAmount: '0.5',
            displayUnit: 'g (1 paket)',
          },
          {
            foodItemId: kokosflingor.id,
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vaniljpulver.id,
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
            instruction: 'Sätt ugnen på 200 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ihop alla ingredienser',
          },
          {
            stepNumber: 3,
            instruction: 'Fördela smeten i formar (Mindre formar fler muffins, större formar färre muffins)',
          },
          {
            stepNumber: 4,
            instruction: 'Ställ in plåten med muffins i ugnen i 15-20 minuter',
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
