import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Vanilj keso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Vanilj kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Frysta jordgubbar': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  'Sötströ (kan uteslutas)': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍓 Creating Evelinas kesofrutti recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const vaniljKeso = await findOrCreateFoodItem('Vanilj keso')
  const vaniljKvarg = await findOrCreateFoodItem('Vanilj kvarg')
  const frystaJordgubbar = await findOrCreateFoodItem('Frysta jordgubbar')
  const sotstro = await findOrCreateFoodItem('Sötströ (kan uteslutas)')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Evelinas kesofrutti',
      description: 'En nyttigare & godare variant av risifrutti. Perfekt kvällsmål!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/gJ4z4KPK/2025-11-14-12-43-47-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 118,
      proteinPerServing: 17,
      carbsPerServing: 7,
      fatPerServing: 2,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: vaniljKeso.id,
            amount: 66,
            displayAmount: '66',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljKvarg.id,
            amount: 66,
            displayAmount: '66',
            displayUnit: 'g',
          },
          {
            foodItemId: frystaJordgubbar.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda vaniljkeso och vaniljkvarg 50/50.',
          },
          {
            stepNumber: 2,
            instruction: 'Tina jordgubbar i micron eller i kastrull och tillsätt 1 tsk sötströ. Rör runt/mixa så du får något som liknar sylt.',
          },
          {
            stepNumber: 3,
            instruction: 'Häll "sylten" över vaniljblandningen. Färdig att avnjutas!',
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
