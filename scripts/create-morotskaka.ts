import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Riven morot': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Citronsaft': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
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
  console.log('🥕 Creating Morotskaka recipe...\n')

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
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const rivenmorot = await findOrCreateFoodItem('Riven morot')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const citronsaft = await findOrCreateFoodItem('Citronsaft')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Morotskaka',
      description: 'Mastig kaka med fräsch frosting som passar fint till frukost eller mellanmål',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nzfCyNqy/2025-11-14-10-26-33-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: rivenmorot.id,
            amount: 100, // 1 dl ≈ 100g
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: citronsaft.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: kardemumma.id,
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
            instruction: 'Förbered frostingen kvällen innan. Lägg vaniljkvarg i ett kaffefilter och låt rinna av i kylskågsvis ett dricksglas.',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa havregrynen till mjöl',
          },
          {
            stepNumber: 3,
            instruction: 'Låt den rivna moroten torka på en bit hushållspapper en stund innan',
          },
          {
            stepNumber: 4,
            instruction: 'Blanda havremjöl, vaniljkvarg, ägg, riven morot, bakpulver, 0.5 msk sötströ, kanel och kardemumma',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg smeten i en liten ugnsform. Dubbel sats passar bra i en matlåda i glas',
          },
          {
            stepNumber: 6,
            instruction: '200 grader ca 20 min. Kakan ska vara "torr" i mitten',
          },
          {
            stepNumber: 7,
            instruction: 'Blanda den avrunna vaniljkvärgen med lite citronsaft och sötströ. Bred på den på kakan när den svalnat',
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
