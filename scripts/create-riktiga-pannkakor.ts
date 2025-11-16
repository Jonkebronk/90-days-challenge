import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Naturell kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Vanilj kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Bovetemjöl': { calories: 335, protein: 12, carbs: 70, fat: 3.4 },
  'Durumvete mjöl': { calories: 339, protein: 13, carbs: 71, fat: 1.5 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating "Riktiga" pannkakor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const naturellkvarg = await findOrCreateFoodItem('Naturell kvarg')
  const vaniljkvarg = await findOrCreateFoodItem('Vanilj kvarg')
  const bovetemjol = await findOrCreateFoodItem('Bovetemjöl')
  const durumvetemjol = await findOrCreateFoodItem('Durumvete mjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const salt = await findOrCreateFoodItem('Salt')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: '"Riktiga" pannkakor',
      description: 'Underbara pannkakor som är mycket lika riktiga pannkakor',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nr5TZHTx/2025-11-14-10-22-31-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 40,
      carbsPerServing: 35,
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
            foodItemId: naturellkvarg.id,
            amount: 101,
            displayAmount: '101',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: bovetemjol.id,
            amount: 24,
            displayAmount: '24',
            displayUnit: 'g',
          },
          {
            foodItemId: durumvetemjol.id,
            amount: 24,
            displayAmount: '24',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: salt.id,
            amount: 0.5, // 0.5 krm
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
          {
            foodItemId: sotstro.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ägg, kvarg och vatten till en jämn smet',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt durumvete, bovete, salt och sötströ blanda till en jämn smet i samma tjocklek som pannkakor',
          },
          {
            stepNumber: 3,
            instruction: 'Stek på medelhög till hög värme',
          },
          {
            stepNumber: 4,
            instruction: 'Servera med vaniljkvarg och gärna hallon',
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
