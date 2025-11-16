import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🎂 Creating Rulltårta recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Rulltårta',
      description: 'Rulltårta på havremjöl. Perfekt till frukost eller mellis',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/T3cmJdmq/2025-11-14-10-16-52-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 362,
      proteinPerServing: 17,
      carbsPerServing: 29,
      fatPerServing: 19,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 95,
            displayAmount: '95',
            displayUnit: 'g',
          },
          {
            foodItemId: linfroolja.id,
            amount: 6,
            displayAmount: '6',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 2.5, // 0.5 tsk ≈ 2.5g
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vatten.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 225Â°',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda alla ingredienser',
          },
          {
            stepNumber: 3,
            instruction: 'Häll ut i en smord ugnsform',
          },
          {
            stepNumber: 4,
            instruction: 'Grädda ca 10 minuter',
          },
          {
            stepNumber: 5,
            instruction: 'Låt kallna och fyll med passande fyllning',
          },
          {
            stepNumber: 6,
            instruction: 'Kan förvaras i kylskåp',
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
