import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Chiafrön': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  'Whey-80': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🥣 Creating Gröt på whey recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const chiafron = await findOrCreateFoodItem('Chiafrön')
  const whey = await findOrCreateFoodItem('Whey-80')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Gröt på whey',
      description: 'Gröt på whey',
      categoryId: category.id,
      servings: 1,
      coverImage: null,
      caloriesPerServing: 478,
      proteinPerServing: 33,
      carbsPerServing: 47,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: chiafron.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: whey.id,
            amount: 29,
            displayAmount: '29',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 150, // 1.5 dl = 150ml
            displayAmount: '1.5',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Havregryn',
          },
          {
            stepNumber: 2,
            instruction: 'Wheyprotein',
          },
          {
            stepNumber: 3,
            instruction: '2 dl vatten',
          },
          {
            stepNumber: 4,
            instruction: 'Rör om',
          },
          {
            stepNumber: 5,
            instruction: '2 msk chiafrön',
          },
          {
            stepNumber: 6,
            instruction: 'Rör om',
          },
          {
            stepNumber: 7,
            instruction: 'Frysta hallon',
          },
          {
            stepNumber: 8,
            instruction: 'Locket på',
          },
          {
            stepNumber: 9,
            instruction: 'In i kylskåpet kvällen innan',
          },
          {
            stepNumber: 10,
            instruction: 'Ät kall på morgonen. 👍😋',
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
