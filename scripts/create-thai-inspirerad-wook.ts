import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Chilifruit': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Klyftor vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🍛 Creating Thai-inspirerad wook recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const ris = await findOrCreateFoodItem('Ris')
  const lok = await findOrCreateFoodItem('Lök')
  const paprika = await findOrCreateFoodItem('Paprika')
  const chilifruit = await findOrCreateFoodItem('Chilifruit')
  const vitlok = await findOrCreateFoodItem('Klyftor vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Thai-inspirerad wook',
      description: 'Thai-inspirerad wook',
      categoryId: category.id,
      servings: 1,
      coverImage: '', // No image URL provided
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 120,
            displayAmount: '120',
            displayUnit: 'g',
          },
          {
            foodItemId: chilifruit.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka upp riset',
          },
          {
            stepNumber: 2,
            instruction: 'Stek lök, chili och vitlök i kokosoljan',
          },
          {
            stepNumber: 3,
            instruction: 'Stek kyckling i samma stekpanna som löken, chiliin och vitlöken',
          },
          {
            stepNumber: 4,
            instruction: 'Stek paprikan tillsammans med resten',
          },
          {
            stepNumber: 5,
            instruction: 'När riset är klart, häll det i stekpannan med resten och stek upp allt tillsammans.',
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
  console.log('\n⚠️  Note: Recipe created without cover image')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
