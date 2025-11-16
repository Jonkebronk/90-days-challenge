import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Köttfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Bönlasagneplator': { calories: 350, protein: 24, carbs: 48, fat: 5 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Krossade tomater': { calories: 32, protein: 1.2, carbs: 6.3, fat: 0.3 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Tomat': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🍝 Creating Matig lasagne recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kottfars = await findOrCreateFoodItem('Köttfärs')
  const bonlasagne = await findOrCreateFoodItem('Bönlasagneplator')
  const ris = await findOrCreateFoodItem('Ris')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const champinjoner = await findOrCreateFoodItem('Champinjoner')
  const paprika = await findOrCreateFoodItem('Paprika')
  const tomat = await findOrCreateFoodItem('Tomat')
  const vitlok = await findOrCreateFoodItem('Vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Matig lasagne',
      description: 'Matig lasagne med köttfärs, ris och grönsaker.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/SQP8C5cY/2025-11-15-12-39-14-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 514,
      proteinPerServing: 54,
      carbsPerServing: 61,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kottfars.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
          {
            foodItemId: bonlasagne.id,
            amount: 53,
            displayAmount: '53',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 18,
            displayAmount: '18',
            displayUnit: 'g',
          },
          {
            foodItemId: krossadeTomater.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: tomat.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
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
            instruction: 'Sätt ugnen på 200 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Koka ris',
          },
          {
            stepNumber: 3,
            instruction: 'Stek lök, vitlök, paprika och champinjoner.',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg i köttfärs och fortsätt steka tills det är genomstekt. Smaksätt med valfria kryddor, t.ex. svartpeppar och paprikapulver.',
          },
          {
            stepNumber: 5,
            instruction: 'Blanda i det kokta riset',
          },
          {
            stepNumber: 6,
            instruction: 'Smörj ugnform med kokosolja, varva lasagneplator (ca 6-7 plattor per lager) med köttfärsblandning och krossade tomater',
          },
          {
            stepNumber: 7,
            instruction: 'Skiva en tomat och lägg på toppen',
          },
          {
            stepNumber: 8,
            instruction: 'Grädda i ugnen i 30 minuter.',
          },
          {
            stepNumber: 9,
            instruction: 'Rekommenderar att få stajpa i kylskåp om man önskar en kompaktare form, då blir det lättare att skära ur rutor ur ugnsformen.',
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
