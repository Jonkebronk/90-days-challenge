import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon': { calories: 53, protein: 1.2, carbs: 12, fat: 0.3 },
  'Keso': { calories: 72, protein: 12.6, carbs: 3.6, fat: 0.6 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Äggvita': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  'Saffran': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Himmelsk saffranspannkaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hallon = await findOrCreateFoodItem('Hallon')
  const keso = await findOrCreateFoodItem('Keso')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const aggvita = await findOrCreateFoodItem('Äggvita')
  const saffran = await findOrCreateFoodItem('Saffran')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Himmelsk saffranspannkaka',
      description: 'Passar bra till kvällsmålet när du har lite extra kvarg.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/6qgVFtf2/2025-11-14-11-44-56-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 128,
      proteinPerServing: 20,
      carbsPerServing: 7,
      fatPerServing: 1,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallon.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 79,
            displayAmount: '79',
            displayUnit: 'g',
          },
          {
            foodItemId: aggvita.id,
            amount: 56,
            displayAmount: '56',
            displayUnit: 'g',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 7.5, // 0.5 msk ≈ 7.5ml
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Vispa äggvita med sötströ så det blir hårt.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda i keso & saffran',
          },
          {
            stepNumber: 3,
            instruction: 'In i ugnen på 200° tills den blir fast',
          },
          {
            stepNumber: 4,
            instruction: 'Låt svalna något',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg på vaniljkvarg & hallon',
          },
          {
            stepNumber: 6,
            instruction: 'N J U T',
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
