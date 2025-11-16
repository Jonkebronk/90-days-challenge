import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hjortronsylt': { calories: 250, protein: 0.5, carbs: 60, fat: 0.5 },
  'Chiafrön': { calories: 486, protein: 17, carbs: 42, fat: 31 },
  'Arla vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Yoggi mini hallon': { calories: 66, protein: 4.5, carbs: 10, fat: 1.5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Naturella steviadroppar': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥣 Creating Norrländsk overnight oat recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hjortronsylt = await findOrCreateFoodItem('Hjortronsylt')
  const chiafron = await findOrCreateFoodItem('Chiafrön')
  const arlavaniljkvarg = await findOrCreateFoodItem('Arla vaniljkvarg')
  const yoggiminihallon = await findOrCreateFoodItem('Yoggi mini hallon')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const steviadroppar = await findOrCreateFoodItem('Naturella steviadroppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Norrländsk overnight oat',
      description: 'Superenkel och god frukost med en norrländsk touch.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/fRSNXKPv/2025-11-14-11-05-12-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 377,
      proteinPerServing: 17,
      carbsPerServing: 44,
      fatPerServing: 15,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hjortronsylt.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: chiafron.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: arlavaniljkvarg.id,
            amount: 0,
            displayAmount: '0',
            displayUnit: 'g',
          },
          {
            foodItemId: yoggiminihallon.id,
            amount: 199,
            displayAmount: '199',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: steviadroppar.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Egen hjortronsylt: koka bären, tillsätt en skvatt vatten och ev några droppe av naturell stevia. Låt småkoka till konsistensen känns ok. Smaka av.',
          },
          {
            stepNumber: 2,
            instruction: 'Väg upp havregryn, lägg i botten av en passande burk.',
          },
          {
            stepNumber: 3,
            instruction: 'Häll i kvarg, Yoggi och chiafrön. Blanda.',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg bär/sylt på toppen/sat stå till dagen efter.',
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
