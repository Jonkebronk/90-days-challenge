import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn malt till mjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Fiberhusk': { calories: 200, protein: 2, carbs: 80, fat: 1 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
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
  console.log('🍰 Creating Bärkaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Bär')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn malt till mjöl')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const vatten = await findOrCreateFoodItem('Vatten')
  const fiberhusk = await findOrCreateFoodItem('Fiberhusk')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Bärkaka',
      description: 'En lyxig bärkaka att starta dagen med',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/SK3WJZc0/2025-11-14-10-25-10-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 493,
      proteinPerServing: 41,
      carbsPerServing: 38,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: bar.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: linfroolja.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: fiberhusk.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: kardemumma.id,
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
            instruction: 'Vispa ihop alla ingredienser utom bären. Välj kryddor efter egen smak',
          },
          {
            stepNumber: 2,
            instruction: 'Gall halva smeten i smord ugnsfast form',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg på bären',
          },
          {
            stepNumber: 4,
            instruction: 'Häll på resterande del av smeten',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda i ugnen i ca 15 minuter på 200 grader',
          },
          {
            stepNumber: 6,
            instruction: 'Servera med kvarg i valfri smak',
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
