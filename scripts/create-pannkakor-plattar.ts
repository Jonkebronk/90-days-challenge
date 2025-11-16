import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Osockrade bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Naturell yoghurt': { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Pannkakor/Plättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Osockrade bär')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const yoghurt = await findOrCreateFoodItem('Naturell yoghurt')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Pannkakor/Plättar',
      description: 'Perfekt som frukost!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/52qvSwTg/2025-11-14-11-46-09-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 486,
      proteinPerServing: 43,
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
            foodItemId: havremjol.id,
            amount: 35,
            displayAmount: '35',
            displayUnit: 'g',
          },
          {
            foodItemId: yoghurt.id,
            amount: 106,
            displayAmount: '106',
            displayUnit: 'g',
          },
          {
            foodItemId: kardemumma.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ihop havremjöl/mjöl, ägg och naturell yoghurt till en smet',
          },
          {
            stepNumber: 2,
            instruction: 'Stek i kokosolja. Antingen små plättar eller stora pannkakor.',
          },
          {
            stepNumber: 3,
            instruction: 'Strö över lite kanel/kardemumma',
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
