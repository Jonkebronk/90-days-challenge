import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 20, carbs: 0, fat: 18 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Krossade tomater med basilika': { calories: 32, protein: 1.6, carbs: 7, fat: 0.3 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Blandade grönsaker': { calories: 35, protein: 2, carbs: 7, fat: 0.2 },
  'Tomatpuré': { calories: 82, protein: 4.2, carbs: 18, fat: 0.5 },
  'Ketchup': { calories: 112, protein: 1.2, carbs: 27, fat: 0.1 },
  'Vitlöksklyfta': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Oregano': { calories: 265, protein: 9, carbs: 69, fat: 4.3 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Paprikapulver': { calories: 282, protein: 14, carbs: 54, fat: 13 },
  'Cayennepeppar': { calories: 318, protein: 12, carbs: 57, fat: 17 },
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
  console.log('🍝 Creating Köttfärssås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const ris = await findOrCreateFoodItem('Ris')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater med basilika')
  const gulLok = await findOrCreateFoodItem('Gul lök')
  const blandadeGronsaker = await findOrCreateFoodItem('Blandade grönsaker')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const ketchup = await findOrCreateFoodItem('Ketchup')
  const vitloksklyfta = await findOrCreateFoodItem('Vitlöksklyfta')
  const oregano = await findOrCreateFoodItem('Oregano')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const paprikapulver = await findOrCreateFoodItem('Paprikapulver')
  const cayennepeppar = await findOrCreateFoodItem('Cayennepeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttfärssås',
      description: 'En god och tomatig köttfärssås, klar på ett nafs.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/ZRzWRtNQ/2025-11-15-13-19-51-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: krossadeTomater.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: gulLok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: blandadeGronsaker.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatpure.id,
            amount: 7.5,
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
          {
            foodItemId: ketchup.id,
            amount: 7.5,
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
          {
            foodItemId: vitloksklyfta.id,
            amount: 3,
            displayAmount: '1',
            displayUnit: 'klyfta',
          },
          {
            foodItemId: oregano.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: paprikapulver.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: cayennepeppar.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Stek köttfärsen tillsammans med den rivna löken och pressade vitlöken',
          },
          {
            stepNumber: 2,
            instruction: 'Ha i tomatkross, tomatpuré, ketchup och vatten',
          },
          {
            stepNumber: 3,
            instruction: 'Krydda efter behag',
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
