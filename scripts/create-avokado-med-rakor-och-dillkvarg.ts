import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Avokado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  'Räkor': { calories: 99, protein: 24, carbs: 0.9, fat: 1.1 },
  'Naturell kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Färskpressad citronjuice': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
  'Dill': { calories: 43, protein: 3.5, carbs: 7, fat: 1.1 },
  'Herbamare örtsalt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Svartpeppar': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥑 Creating Avokado med räkor och dillkvarg! recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const avokado = await findOrCreateFoodItem('Avokado')
  const rakor = await findOrCreateFoodItem('Räkor')
  const kvarg = await findOrCreateFoodItem('Naturell kvarg')
  const citronjuice = await findOrCreateFoodItem('Färskpressad citronjuice')
  const dill = await findOrCreateFoodItem('Dill')
  const herbamare = await findOrCreateFoodItem('Herbamare örtsalt')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Avokado med räkor och dillkvarg!',
      description: 'När man vill lyxa till det.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PqwdsjnT/2025-11-14-12-35-43-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 256,
      proteinPerServing: 21,
      carbsPerServing: 3,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: avokado.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: rakor.id,
            amount: 79,
            displayAmount: '79',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 43,
            displayAmount: '43',
            displayUnit: 'g',
          },
          {
            foodItemId: citronjuice.id,
            amount: 20, // 4 tsk ≈ 20ml
            displayAmount: '4',
            displayUnit: 'tsk',
          },
          {
            foodItemId: dill.id,
            amount: 40, // 8 tsk ≈ 40ml
            displayAmount: '8',
            displayUnit: 'tsk',
          },
          {
            foodItemId: herbamare.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: svartpeppar.id,
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
            instruction: 'Halvera avokadon.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda övriga ingredienser och lägg röran på avokadon.',
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
