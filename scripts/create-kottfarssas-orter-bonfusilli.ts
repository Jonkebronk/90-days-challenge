import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Bönfusilli': { calories: 350, protein: 24, carbs: 48, fat: 5 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Tomatpuré': { calories: 82, protein: 4.3, carbs: 16, fat: 0.5 },
  'Krossade tomater': { calories: 32, protein: 1.2, carbs: 6.3, fat: 0.3 },
  'Grönsaker breschid/sallad': { calories: 20, protein: 1, carbs: 4, fat: 0.2 },
  'Chili': { calories: 40, protein: 1.9, carbs: 8.8, fat: 0.4 },
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
  console.log('🍝 Creating Köttfärssås med örter & bönfusilli recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const bonfusilli = await findOrCreateFoodItem('Bönfusilli')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater')
  const gronsaker = await findOrCreateFoodItem('Grönsaker breschid/sallad')
  const chili = await findOrCreateFoodItem('Chili')
  const vitlok = await findOrCreateFoodItem('Vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttfärssås med örter & bönfusilli',
      description: 'Smakrik köttfärssås med örter och bönfusilli. Perfekt att göra storkok!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/wjmk1zPT/2025-11-15-12-37-42-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: bonfusilli.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 27,
            displayAmount: '27',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatpure.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
          },
          {
            foodItemId: krossadeTomater.id,
            amount: 133,
            displayAmount: '133',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 36,
            displayAmount: '36',
            displayUnit: 'g',
          },
          {
            foodItemId: chili.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Frås köttfärsen i valfri olja, gärna lite i taget så det inte börjar koka',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka lök och vitlök',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt lök, vitlök, tomatpuré och svartpeppar och låt steka en stund på medelvärme',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt krossade tomater och lite vatten, låt koka ca 20 minuter',
          },
          {
            stepNumber: 5,
            instruction: 'Koka bönpastan enligt förpackningen',
          },
          {
            stepNumber: 6,
            instruction: 'Hacka och tillsätt färska eller torkade kryddor, koka en stund till',
          },
          {
            stepNumber: 7,
            instruction: 'Smaka av med salt och ev mer kryddor',
          },
          {
            stepNumber: 8,
            instruction: 'Redo att servera! Garnera gärna med färsk eller fryst persilja',
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
