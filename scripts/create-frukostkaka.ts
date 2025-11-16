import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Arlas vaniljkvarg (kan bytas mot annan smak)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍰 Creating Frukostkaka recipe...\n')

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
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const arlasvaniljkvarg = await findOrCreateFoodItem('Arlas vaniljkvarg (kan bytas mot annan smak)')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostkaka',
      description: 'Ett frukostalternativ som med fördel görs dagen innan. Ugnspannkaka möter sockerkaka.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nrG2j64M/2025-11-14-10-52-29-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 474,
      proteinPerServing: 39,
      carbsPerServing: 37,
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
            foodItemId: bar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: linfroolja.id,
            amount: 20, // 2 cl = 20ml ≈ 20g
            displayAmount: '2',
            displayUnit: 'cl',
          },
          {
            foodItemId: arlasvaniljkvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: vaniljpulver.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: bakpulver.id,
            amount: 2.5, // 0.5 tsk ≈ 2.5g
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt på ugnen på 175 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Separera äggvitan från äggulan och vispa äggvitan till ett hårt skum',
          },
          {
            stepNumber: 3,
            instruction: 'Vispa äggula, havremjöl, vatten, kvarg, vaniljpulver och bakpulver i en bunke',
          },
          {
            stepNumber: 4,
            instruction: 'Vänd ned dn vispade äggvitan i blandningen',
          },
          {
            stepNumber: 5,
            instruction: 'Häll linfröoljan i en ugnssäker form och tack kanterna. Häll överbliven linfröolja i smeten',
          },
          {
            stepNumber: 6,
            instruction: 'Häll i smeten i formen',
          },
          {
            stepNumber: 7,
            instruction: 'Fördela bären i formen och tryck ned den försiktigt i smeten',
          },
          {
            stepNumber: 8,
            instruction: 'Grädda mitt i ugnen 30-40 minuter',
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
