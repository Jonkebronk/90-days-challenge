import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Mandlar': { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },
  'Hallon': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Minikeso': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Saffranspannkaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const mandlar = await findOrCreateFoodItem('Mandlar')
  const hallon = await findOrCreateFoodItem('Hallon')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const minikeso = await findOrCreateFoodItem('Minikeso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const saffran = await findOrCreateFoodItem('Saffran')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffranspannkaka',
      description: 'Ljuvlig saffranspankaka',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/bdcCkybf/2025-11-14-10-29-15-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 495,
      proteinPerServing: 35,
      carbsPerServing: 43,
      fatPerServing: 20,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 57,
            displayAmount: '57',
            displayUnit: 'g',
          },
          {
            foodItemId: mandlar.id,
            amount: 18,
            displayAmount: '18',
            displayUnit: 'g',
          },
          {
            foodItemId: hallon.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 91,
            displayAmount: '91',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
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
            instruction: 'Sätt ugnen på 190 g',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa havregryn till ett mjöl och tillsätt kanel',
          },
          {
            stepNumber: 3,
            instruction: 'Mortla saffran tillsammans med sötströ',
          },
          {
            stepNumber: 4,
            instruction: 'Vispa upp ägget',
          },
          {
            stepNumber: 5,
            instruction: 'Blanda ihop alla ingredienser förutom hallonen och häll ner i en ugnssäker form',
          },
          {
            stepNumber: 6,
            instruction: 'Grädda i mitten av ugnen i ca 20 minuter',
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
