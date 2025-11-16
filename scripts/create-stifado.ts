import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötgrytbitar': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Gullök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Sallad (grön)': { calories: 15, protein: 1.4, carbs: 2.4, fat: 0.2 },
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
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
  console.log('🍲 Creating Stifado (grekisk nötköttsgryta) med ris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notgrytbitar = await findOrCreateFoodItem('Nötgrytbitar')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const gullok = await findOrCreateFoodItem('Gullök')
  const sallad = await findOrCreateFoodItem('Sallad (grön)')
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Calculate nutrition per serving
  const calories = Math.round(
    (notgrytbitar.calories * 182/100) +
    (ris.calories * 70/100) +
    (tomater.calories * 100/100) +
    (gullok.calories * 25/100) +
    (sallad.calories * 75/100) +
    (kokosolja.calories * 1/100) // 1 tsk ≈ 5g, but using 1g for low amount
  )

  const protein = Math.round(
    (notgrytbitar.proteinG * 182/100) +
    (ris.proteinG * 70/100) +
    (tomater.proteinG * 100/100) +
    (gullok.proteinG * 25/100) +
    (sallad.proteinG * 75/100)
  )

  const carbs = Math.round(
    (ris.carbsG * 70/100) +
    (tomater.carbsG * 100/100) +
    (gullok.carbsG * 25/100) +
    (sallad.carbsG * 75/100)
  )

  const fat = Math.round(
    (notgrytbitar.fatG * 182/100) +
    (ris.fatG * 70/100) +
    (tomater.fatG * 100/100) +
    (gullok.fatG * 25/100) +
    (sallad.fatG * 75/100) +
    (kokosolja.fatG * 1/100)
  )

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Stifado (grekisk nötköttsgryta) med ris',
      description: 'Långkok och mycket god gryta för vardag som helg! Smakrik och passar till Ris eller potatis!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PfmPc0my/2025-11-14-13-38-44-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: calories,
      proteinPerServing: protein,
      carbsPerServing: carbs,
      fatPerServing: fat,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notgrytbitar.id,
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
            foodItemId: tomater.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: sallad.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 500, // 5 dl
            displayAmount: '5',
            displayUnit: 'dl',
            optional: false,
            notes: 'för kokning'
          },
          {
            foodItemId: kokosolja.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala, hacka lök. Stek i olja tillsammans med vitlöken, i med grytbitarna.',
          },
          {
            stepNumber: 2,
            instruction: 'Bryn köttbitarna med löken och låt det vatska av sig',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt därefter buljong, oregano, lagerblad, kanelstång och mald nejlika.',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt krossade tomater. Låt grytan koka minst 2 timmar. Tillsätt vatten under tiden.',
          },
          {
            stepNumber: 5,
            instruction: 'Strax före servering: koka ris eller potatis.',
          },
          {
            stepNumber: 6,
            instruction: 'Servera med grönsallad! Tips: Koka helst 4-5 timmar för bästa smak.',
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
