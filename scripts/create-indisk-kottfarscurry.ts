import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Köttfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Finhackade lökar': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
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
  console.log('🍛 Creating Indisk köttfärscurry recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kottfars = await findOrCreateFoodItem('Köttfärs')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const lokar = await findOrCreateFoodItem('Finhackade lökar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Indisk köttfärscurry',
      description: 'Indisk köttfärscurry',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/jjFZpDYh/2025-11-14-13-44-56-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kottfars.id,
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
            foodItemId: lokar.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda i ordning en kryddblandning bestående av -4 tsk spiskummin -4 tsk koriander -4 tsk gurkmeja -1 tsk chilipulver -5 st vitlöksklyftor -1 bit riven färsk ingefära',
          },
          {
            stepNumber: 2,
            instruction: 'Rör ut denna kryddblandning med ca 0,5 dl vatten och låt stå i 10 min.',
          },
          {
            stepNumber: 3,
            instruction: 'Hetta upp olja/kokosolja och stek -3 finhackade lökar -4 lagerblad - 1-2 krm malen kanel -1-2 krm malda nejlikor -1-2 krm malen kardemumma',
          },
          {
            stepNumber: 4,
            instruction: 'Häll i kryddsmeten och stek vidare i 5 min, låt det ej bränna vid. Fyll på med vatten om det ser torrt ut.',
          },
          {
            stepNumber: 5,
            instruction: 'Stek ca 7 hg köttfärs under tiden i matfett.',
          },
          {
            stepNumber: 6,
            instruction: 'Skala och skär fina tärningar av 3 potatisar.',
          },
          {
            stepNumber: 7,
            instruction: 'Blanda allt tillsammans i en gryta och låt småkoka i 10 min.',
          },
          {
            stepNumber: 8,
            instruction: 'Tillsätt 2-4 buljongtärningar, 2 burkar krossade tomater och köttfärsen',
          },
          {
            stepNumber: 9,
            instruction: 'Smaka av med salt och eventuellt en tsk chiliflakes för mer hetta',
          },
          {
            stepNumber: 10,
            instruction: 'Koka ytterligare 10-15 min. koka under tiden basmatisoris',
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
