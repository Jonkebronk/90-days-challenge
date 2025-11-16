import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Propud chokladbollssmak': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Proteinpulver Chokladsmak': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Kokos': { calories: 660, protein: 6, carbs: 7, fat: 65 },
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
  console.log('🍫 Creating Prodpud-chokladbollar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const propud = await findOrCreateFoodItem('Propud chokladbollssmak')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver Chokladsmak')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const kokos = await findOrCreateFoodItem('Kokos')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Prodpud-chokladbollar',
      description: 'Nyttigare chokladbollar när sötsuget slår till!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/DZmCS25M/2025-11-14-11-47-30-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 474,
      proteinPerServing: 25,
      carbsPerServing: 33,
      fatPerServing: 26,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kokosolja.id,
            amount: 21,
            displayAmount: '21',
            displayUnit: 'g',
          },
          {
            foodItemId: propud.id,
            amount: 84,
            displayAmount: '84',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 13,
            displayAmount: '13',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: kokos.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda samman Propud, havregryn, proteinpulver och kokosolja till en jamn smet.',
          },
          {
            stepNumber: 2,
            instruction: 'Ställ in i kylen tills den stelnat tillräcklig att det går att rulla bollar.',
          },
          {
            stepNumber: 3,
            instruction: 'Forma till bollar och om så önskas kan de rullas i lite kokos.',
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
