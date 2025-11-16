import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Hallon': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Larsas grekiska yoghurt 0%fett': { calories: 57, protein: 10.3, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
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
  console.log('🥞 Creating Saffransplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const hallon = await findOrCreateFoodItem('Hallon')
  const yoghurt = await findOrCreateFoodItem('Larsas grekiska yoghurt 0%fett')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const saffran = await findOrCreateFoodItem('Saffran')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffransplättar',
      description: 'Go frukost de dagar man vill lyxa till det.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/90Swz06c/2025-11-14-10-15-21-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 478,
      proteinPerServing: 39,
      carbsPerServing: 38,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 119,
            displayAmount: '119',
            displayUnit: 'g',
          },
          {
            foodItemId: linfroolja.id,
            amount: 20, // 2 cl = 20ml
            displayAmount: '2',
            displayUnit: 'cl',
          },
          {
            foodItemId: hallon.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: yoghurt.id,
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
            foodItemId: vatten.id,
            amount: 45, // 3 msk ≈ 45ml
            displayAmount: '3',
            displayUnit: 'msk',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
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
            instruction: 'Mixa alla ingredienser utom hallonen till en jämn smet',
          },
          {
            stepNumber: 2,
            instruction: 'Ha i vatten efter behag',
          },
          {
            stepNumber: 3,
            instruction: 'Stek på medelhög värme i lite kokosolja eller rapsolja',
          },
          {
            stepNumber: 4,
            instruction: 'Värm hallonen i Micron ha i lite sötströ och rör ihop till en sylt',
          },
          {
            stepNumber: 5,
            instruction: 'Ringla över plättarna',
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
