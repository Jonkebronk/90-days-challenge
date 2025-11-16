import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Keso mini': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Fiberhavregryn': { calories: 350, protein: 13, carbs: 55, fat: 8 },
  'Bubbelvatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🧇 Creating Frasiga våfflor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kesomini = await findOrCreateFoodItem('Keso mini')
  const fiberhavregryn = await findOrCreateFoodItem('Fiberhavregryn')
  const bubbelvatten = await findOrCreateFoodItem('Bubbelvatten')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frasiga våfflor',
      description: 'Brukar bli ca 2 våfflor. Ätes direkt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/NM6HJQ2N/2025-11-14-10-07-37-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: kesomini.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: fiberhavregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bubbelvatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: kanel.id,
            amount: 1, // En nypa
            displayAmount: '1',
            displayUnit: 'nypa',
          },
          {
            foodItemId: kardemumma.id,
            amount: 1, // En nypa
            displayAmount: '1',
            displayUnit: 'nypa',
          },
          {
            foodItemId: vaniljpulver.id,
            amount: 1, // En nypa
            displayAmount: '1',
            displayUnit: 'nypa',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynen till havremjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ner alla ingredienser och fyll på med bubbelvatten till smeten har lagom konsistens',
          },
          {
            stepNumber: 3,
            instruction: 'Smorj våffeldagen med lite kokosolja',
          },
          {
            stepNumber: 4,
            instruction: 'Smaklig måltid!',
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
