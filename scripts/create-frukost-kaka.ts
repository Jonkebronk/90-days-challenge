import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Kokosolja': { calories: 892, protein: 0, carbs: 0, fat: 99 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Wheyprotein vaniljsmak': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🍰 Creating Frukost-kaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const wheyprotein = await findOrCreateFoodItem('Wheyprotein vaniljsmak')
  const havremjol = await findOrCreateFoodItem('Havremjöl')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukost-kaka',
      description: 'Frukostkaka, liknande tjockpannkaka, som med fördel serveras med ICAs sylt utan socker.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/3wwbmJNg/2025-11-14-11-09-10-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 460,
      proteinPerServing: 40,
      carbsPerServing: 34,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 119,
            displayAmount: '119',
            displayUnit: 'g',
          },
          {
            foodItemId: kokosolja.id,
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 89,
            displayAmount: '89',
            displayUnit: 'g',
          },
          {
            foodItemId: wheyprotein.id,
            amount: 12,
            displayAmount: '12',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
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
            instruction: 'Smorj en form med kokosolja. Blanda ihop alla ingredienser och fyll formen. Tryck ner några enstaka hallon eller blåbär i smeten. In i ugnen på 200 grader tills den blir gryllenbrun, ca 20 minuter.',
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
