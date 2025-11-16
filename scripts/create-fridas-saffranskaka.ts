import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Minikeso': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
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
  console.log('🍰 Creating Fridas saffranskaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const minikeso = await findOrCreateFoodItem('Minikeso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const saffran = await findOrCreateFoodItem('Saffran')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fridas saffranskaka',
      description: 'Supergod frukost med julsmaker!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/wxDVZpYP/2025-11-14-10-06-16-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: vaniljkvarg.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 101,
            displayAmount: '101',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
          {
            foodItemId: kanel.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa havregryn tills det blir som mjöl. Tillsätt saffran & kanel.',
          },
          {
            stepNumber: 3,
            instruction: 'Vispa ett ägg vid sidan av, häll över det och resterande ingredienser i mjölblandningen.',
          },
          {
            stepNumber: 4,
            instruction: 'Mixa allt och häll över blandningen i en liten ugnssäker form.',
          },
          {
            stepNumber: 5,
            instruction: 'Ställ in i ugnen i cirka 25 minuter tills kakan blivit fast. NJUT!',
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
