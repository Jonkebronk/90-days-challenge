import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Chiafrön': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  'Ägg (kan uteslutas)': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Naturell lättkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sesamfrön': { calories: 573, protein: 17.7, carbs: 23.5, fat: 49.7 },
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
  console.log('🍞 Creating Saftigt kvargbröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const chiafron = await findOrCreateFoodItem('Chiafrön')
  const agg = await findOrCreateFoodItem('Ägg (kan uteslutas)')
  const naturellkvarg = await findOrCreateFoodItem('Naturell lättkvarg')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const salt = await findOrCreateFoodItem('Salt')
  const sesamfron = await findOrCreateFoodItem('Sesamfrön')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saftigt kvargbröd',
      description: 'Ett enkelt och snabbt kvargbröd med endast ett fåtal ingredienser!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/KzQMhxxZ/2025-11-14-11-37-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 36,
      carbsPerServing: 42,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: chiafron.id,
            amount: 17,
            displayAmount: '17',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 72,
            displayAmount: '72',
            displayUnit: 'g',
          },
          {
            foodItemId: naturellkvarg.id,
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
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: salt.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: sesamfron.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Ställ ugnen på 200 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Rör samman alla ingredienser tills du får en jamn smet',
          },
          {
            stepNumber: 3,
            instruction: 'Klicka ut fyra stycken bollar som du plattar till lite på en bakplåtsklad ugnsplåt. Strö över sesamfrön.',
          },
          {
            stepNumber: 4,
            instruction: 'Grädda mitt i ugnen i ca 20 minuter tills de får en gyllenbrun färg.',
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
