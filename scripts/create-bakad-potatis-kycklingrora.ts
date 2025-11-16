import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Naturell kvarg': { calories: 68, protein: 11, carbs: 4, fat: 0.2 },
  'Bakpotatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Röd paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
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
  console.log('🥔 Creating Bakad potatis med kycklingröra recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfile = await findOrCreateFoodItem('Kycklingfilé')
  const kvarg = await findOrCreateFoodItem('Naturell kvarg')
  const bakpotatis = await findOrCreateFoodItem('Bakpotatis')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const paprika = await findOrCreateFoodItem('Röd paprika')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Bakad potatis med kycklingröra',
      description: 'En god gegga till bakpotatis som man själv bestämmer hur stark den ska vara.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/1zPLv80L/2025-11-15-12-02-37-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 51,
      carbsPerServing: 61,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfile.id,
            amount: 125,
            displayAmount: '125',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 82,
            displayAmount: '82',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpotatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skär kycklingfilé i tärningar och bryn dem. Lägg dem åt sidan för att svalna',
          },
          {
            stepNumber: 2,
            instruction: 'Finhacka lök och paprika och blanda med kvarg',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt kryddorna efter behag',
          },
          {
            stepNumber: 4,
            instruction: 'I med kycklingfilén och rör om servera med potatisen',
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
