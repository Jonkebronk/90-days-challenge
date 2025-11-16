import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Argjula': { calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7 },
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
  console.log('🍖 Creating Köttfärslimpa recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const potatis = await findOrCreateFoodItem('Potatis')
  const paprika = await findOrCreateFoodItem('Paprika')
  const lok = await findOrCreateFoodItem('Lök')
  const argjula = await findOrCreateFoodItem('Argjula')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttfärslimpa',
      description: '',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/cCLmCnqp/2025-11-15-12-37-08-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 46,
      carbsPerServing: 58,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 152,
            displayAmount: '152',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 140,
            displayAmount: '140',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
          },
          {
            foodItemId: argjula.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skär paprikan och löken i små bitar.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda alla ingredienser i en bunke.',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg "smeten" i en ugnsform och forma till en limpa.',
          },
          {
            stepNumber: 4,
            instruction: 'In i ugnen på 200 grader i ca 30-45 min.',
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
