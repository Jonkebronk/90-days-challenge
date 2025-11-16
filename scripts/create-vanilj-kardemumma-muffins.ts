import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Tyngre kasein protein vaniljdrömmar': { calories: 385, protein: 80, carbs: 8, fat: 3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ (valfritt)': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🧁 Creating Vanilj & kardemumma muffins recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Bär')
  const proteinpulver = await findOrCreateFoodItem('Tyngre kasein protein vaniljdrömmar')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const sotstro = await findOrCreateFoodItem('Sötströ (valfritt)')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Vanilj & kardemumma muffins',
      description: 'Söta och goda frukostmuffins',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PJbyvPGW/2025-11-14-12-20-43-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 484,
      proteinPerServing: 43,
      carbsPerServing: 33,
      fatPerServing: 19,
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
            foodItemId: bar.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: proteinpulver.id,
            amount: 29,
            displayAmount: '29',
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
            amount: 100, // 1 dl ≈ 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: sotstro.id,
            amount: 30, // 2 msk ≈ 30ml
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: bakpulver.id,
            amount: 2.5, // 0.5 tsk
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kardemumma.id,
            amount: 2.5, // 0.5 tsk
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Finmal havregrynen till ett mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Vispa ägg och ev sötströ fluffigt',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda ner havremjöl, proteinpulver, bakpulver, kardemumma och vatten',
          },
          {
            stepNumber: 4,
            instruction: 'Rör ner bären och fördela i muffinsformar',
          },
          {
            stepNumber: 5,
            instruction: 'Toppa ev med extra bär',
          },
          {
            stepNumber: 6,
            instruction: 'Grädda ca 30 min i 180°',
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
