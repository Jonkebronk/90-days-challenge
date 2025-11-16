import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mandelmjöl': { calories: 600, protein: 20, carbs: 20, fat: 50 },
  'Naturell kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Oregano': { calories: 265, protein: 9, carbs: 69, fat: 4.3 },
  'Chiliflakes': { calories: 318, protein: 12, carbs: 57, fat: 14 },
  'Peppar': { calories: 251, protein: 10.4, carbs: 64, fat: 3.3 },
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
  console.log('🍕 Creating Pizzabröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const mandelmjol = await findOrCreateFoodItem('Mandelmjöl')
  const naturellkvarg = await findOrCreateFoodItem('Naturell kvarg')
  const agg = await findOrCreateFoodItem('Ägg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const oregano = await findOrCreateFoodItem('Oregano')
  const chiliflakes = await findOrCreateFoodItem('Chiliflakes')
  const peppar = await findOrCreateFoodItem('Peppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Pizzabröd',
      description: 'Enkelt och gott att äta till frukost, går att förbereda och ha i kylen.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/1XpTWVsk/2025-11-14-10-30-48-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 477,
      proteinPerServing: 25,
      carbsPerServing: 42,
      fatPerServing: 23,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: mandelmjol.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: naturellkvarg.id,
            amount: 83,
            displayAmount: '83',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 36,
            displayAmount: '36',
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
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: oregano.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: chiliflakes.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: peppar.id,
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
            instruction: 'Mixa havregrynen tills det blir som mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt alla de anda ingredienserna till en smet',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg Bakplåtspapper i en form',
          },
          {
            stepNumber: 4,
            instruction: 'Klicka ut smeten i formen (en sats brukar bli två bröd)',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda i ugnen på 200 grader i 20 minuter',
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
