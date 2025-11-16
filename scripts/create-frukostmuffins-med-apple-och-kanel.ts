import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Äpple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Pepparkakskrydda': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🧁 Creating Frukostmuffins med smak av äpple och kanel recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const apple = await findOrCreateFoodItem('Äpple')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')
  const kanel = await findOrCreateFoodItem('Kanel')
  const pepparkakskrydda = await findOrCreateFoodItem('Pepparkakskrydda')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostmuffins med smak av äpple och kanel',
      description: 'Goda frukostmuffins med smak av äpple och kanel. Smakar som en ljuvlig äppelkaka!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/vBgSTYZZ/2025-11-14-12-19-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 497,
      proteinPerServing: 40,
      carbsPerServing: 40,
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
            foodItemId: apple.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
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
            foodItemId: kardemumma.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: pepparkakskrydda.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börja med att skala och skiva äpplet till små bitar. För att sen steka det till det har mjuknat! Krydda äpplet med kanel under stekningen.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda övriga ingredienser, krydda efter smak.',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt det stekta äpplet med de övriga ingredienserna och fördela i muffinsformar.',
          },
          {
            stepNumber: 4,
            instruction: 'Häll på lite extra kanel innan du stoppar in dem i ugnen.',
          },
          {
            stepNumber: 5,
            instruction: 'Låt de vara i ugnen (200 grader) i ca 17-20 minuter beroende på ugn.',
          },
          {
            stepNumber: 6,
            instruction: 'Kan serveras både varma och kalla.',
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
