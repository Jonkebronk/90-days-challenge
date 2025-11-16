import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Gul Lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Vitlöksklyftor': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Lime': { calories: 30, protein: 0.7, carbs: 11, fat: 0.2 },
  'Chilipulver': { calories: 282, protein: 13, carbs: 50, fat: 14 },
  'Kryddpeppar': { calories: 263, protein: 6, carbs: 72, fat: 9 },
  'Muskot': { calories: 525, protein: 6, carbs: 49, fat: 36 },
  'Timjan': { calories: 276, protein: 9.1, carbs: 64, fat: 7.4 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kryddnejlika': { calories: 274, protein: 6, carbs: 66, fat: 13 },
  'Ingefära': { calories: 80, protein: 1.8, carbs: 18, fat: 0.8 },
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
  console.log('🇯🇲 Creating Kryddig Kycklingfilé med smak från Jamaica recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const gullok = await findOrCreateFoodItem('Gul Lök')
  const vitlok = await findOrCreateFoodItem('Vitlöksklyftor')
  const lime = await findOrCreateFoodItem('Lime')
  const chilipulver = await findOrCreateFoodItem('Chilipulver')
  const kryddpeppar = await findOrCreateFoodItem('Kryddpeppar')
  const muskot = await findOrCreateFoodItem('Muskot')
  const timjan = await findOrCreateFoodItem('Timjan')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kryddnejlika = await findOrCreateFoodItem('Kryddnejlika')
  const ingefara = await findOrCreateFoodItem('Ingefära')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kryddig Kycklingfilé med smak från Jamaica',
      description: 'Kryddig kyckling med smak av bland annat kanel, spiskummin, kryddnejlika och vitlök.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/J0rgzFKQ/2025-11-14-14-28-38-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
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
            foodItemId: gullok.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: lime.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: chilipulver.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kryddpeppar.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: muskot.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: timjan.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kanel.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kryddnejlika.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
            notes: 'Malen'
          },
          {
            foodItemId: ingefara.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
            notes: 'Malen'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala lök och vitlök och dela i mindre bitar',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg loken samt samtliga kryddor i en skål och mixa med stavmixer till en slät kräm',
          },
          {
            stepNumber: 3,
            instruction: 'Häll ner krämen över kycklingen i tex en plastpåse och marinera minst 30 minuter, helst över natten',
          },
          {
            stepNumber: 4,
            instruction: 'Stek kycklingen i kokosolja tills den fått fin färg och är färdig inuti',
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
