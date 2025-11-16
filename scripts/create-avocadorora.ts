import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Avocado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  'Svartpeppar': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Chiliflakes': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Citron': { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
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
  console.log('🥑 Creating Avocadoröra recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const avocado = await findOrCreateFoodItem('Avocado')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const chiliflakes = await findOrCreateFoodItem('Chiliflakes')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const citron = await findOrCreateFoodItem('Citron')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Avocadoröra',
      description: 'En god avocadoröra att ha som tillbehör.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/Hxd9DT8P/2025-11-14-12-30-56-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 158,
      proteinPerServing: 2,
      carbsPerServing: 1,
      fatPerServing: 16,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: avocado.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: chiliflakes.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: vitlok.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: rodlok.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: citron.id,
            amount: 5, // 0.5 tsk ≈ 2.5ml, using 5g
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mosa avocado med gaffel. Finhacka rödlöken. Pressa i vitlök och tillsätt resterande kryddor.',
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
