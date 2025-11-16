import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Högrev': { calories: 143, protein: 20, carbs: 0, fat: 7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 7, fat: 0.2 },
  'Tomatpuré': { calories: 82, protein: 4.3, carbs: 18, fat: 0.5 },
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
  console.log('🍲 Creating Teds Gulasch på högrev recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const hogrev = await findOrCreateFoodItem('Högrev')
  const potatis = await findOrCreateFoodItem('Potatis')
  const lok = await findOrCreateFoodItem('Lök')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Teds Gulasch på högrev',
      description: 'Supergod gulasch på högrev, passar mycket bra för storkok.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/d0BhLTVv/2025-11-15-11-47-29-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hogrev.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 43,
            displayAmount: '43',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 143,
            displayAmount: '143',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatpure.id,
            amount: 14,
            displayAmount: '14',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl ≈ 50ml/g
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Putsa köttet och skär ner i grytbitar',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka lök, vitlök och chili',
          },
          {
            stepNumber: 3,
            instruction: 'Bryn köttet i en gryta tills det har fått färg',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt lök,chili,kryddor och tomatpuré och stek ytterligare någon minut',
          },
          {
            stepNumber: 5,
            instruction: 'Häll på vatten och låt puttra tills köttet kokat sönder (gärna i 3 timmar)',
          },
          {
            stepNumber: 6,
            instruction: 'Skär potatisen i tärningar',
          },
          {
            stepNumber: 7,
            instruction: 'Häll i tomatkrossen och potatisen, låt potatisen koka klart i gulaschen',
          },
          {
            stepNumber: 8,
            instruction: 'Garnera med persilja',
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
