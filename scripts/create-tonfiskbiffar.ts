import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Tonfisk': { calories: 116, protein: 26, carbs: 0, fat: 1 },
  'Äggvita': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  'Kokt potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Havregryn': { calories: 389, protein: 17, carbs: 66, fat: 7 },
  'Dill': { calories: 43, protein: 3.5, carbs: 7, fat: 1.1 },
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
  console.log('🐟 Creating Tonfiskbiffar recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const tonfisk = await findOrCreateFoodItem('Tonfisk')
  const aggvita = await findOrCreateFoodItem('Äggvita')
  const koktPotatis = await findOrCreateFoodItem('Kokt potatis')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const dill = await findOrCreateFoodItem('Dill')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Tonfiskbiffar',
      description: 'Goda tonfiskbiffar med potatis och dill.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/65R03wF4/2025-11-15-12-40-16-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 439,
      proteinPerServing: 48,
      carbsPerServing: 50,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: tonfisk.id,
            amount: 159,
            displayAmount: '159',
            displayUnit: 'g',
          },
          {
            foodItemId: aggvita.id,
            amount: 51,
            displayAmount: '51',
            displayUnit: 'g',
          },
          {
            foodItemId: koktPotatis.id,
            amount: 260,
            displayAmount: '260',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 12,
            displayAmount: '12',
            displayUnit: 'g',
          },
          {
            foodItemId: dill.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mosa den kokta potatisen och blanda i de andra ingredienserna. Forma biffar och stek i olja så de får en krispig yta. Sedan in i ugnen ca 15 min.',
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
