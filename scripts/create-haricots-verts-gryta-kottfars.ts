import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Frysta haricots verts': { calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Tomatpuré': { calories: 82, protein: 4.3, carbs: 16, fat: 0.5 },
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
  console.log('🥘 Creating Haricots verts gryta med köttfärs recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const haricots = await findOrCreateFoodItem('Frysta haricots verts')
  const lok = await findOrCreateFoodItem('Lök')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Haricots verts gryta med köttfärs',
      description: 'Perfekt med ris, enkelt och såsigt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/d3H2yXQH/2025-11-14-13-55-26-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 45,
      carbsPerServing: 60,
      fatPerServing: 8,
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
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: haricots.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 27,
            displayAmount: '27',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 93,
            displayAmount: '93',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatpure.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: vatten.id,
            amount: 1000, // 10 dl
            displayAmount: '10',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Stek köttfärsen i en gryta och tillsätt kryddor.',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt haricots verts och kokat vatten precis så det täcker haricots verts.',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt lök, krossade tomater och tomatpuré',
          },
          {
            stepNumber: 4,
            instruction: 'Koka på hög värme med lock på i 10 minuter. Smaklig måltid.',
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
