import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Chokladbollspropud': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Proteinpulver med chokladsmak': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🍫 Creating Chokladbollsgröt med syrliga hallon recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hallon = await findOrCreateFoodItem('Hallon')
  const chokladbollspropud = await findOrCreateFoodItem('Chokladbollspropud')
  const proteinpulver = await findOrCreateFoodItem('Proteinpulver med chokladsmak')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Chokladbollsgröt med syrliga hallon',
      description: 'Choklad syrligt = svårslagen kombo!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/5yzchNWT/2025-11-14-10-50-06-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 307,
      proteinPerServing: 25,
      carbsPerServing: 35,
      fatPerServing: 5,
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
            foodItemId: chokladbollspropud.id,
            amount: 99,
            displayAmount: '99',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 10,
            displayAmount: '10',
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
            instruction: 'Gör iordning gröten i micron',
          },
          {
            stepNumber: 2,
            instruction: 'Värm hallonen',
          },
          {
            stepNumber: 3,
            instruction: 'Vänta tills gröten har svalnat något. Krydda med kanel. Blanda i propud. Rör om.',
          },
          {
            stepNumber: 4,
            instruction: 'Söta hallonen. Häll över chokladbollsgröten.',
          },
          {
            stepNumber: 5,
            instruction: 'Njut!',
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
