import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Sockerfri hallonsylt': { calories: 30, protein: 0.5, carbs: 7, fat: 0.1 },
  'Keso mini': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Propud vanilj': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
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
  console.log('🍚 Creating Risifrutti recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const hallonsylt = await findOrCreateFoodItem('Sockerfri hallonsylt')
  const kesoMini = await findOrCreateFoodItem('Keso mini')
  const propudVanilj = await findOrCreateFoodItem('Propud vanilj')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Risifrutti',
      description: 'Nyttig version av risifrutti',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/W4RQZqxL/2025-11-14-12-36-32-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 107,
      proteinPerServing: 17,
      carbsPerServing: 6,
      fatPerServing: 1,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallonsylt.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: kesoMini.id,
            amount: 66,
            displayAmount: '66',
            displayUnit: 'g',
          },
          {
            foodItemId: propudVanilj.id,
            amount: 66,
            displayAmount: '66',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Rör ihop keso och propud',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg en klick sylt på toppen',
          },
          {
            stepNumber: 3,
            instruction: 'Ät och njut!',
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
