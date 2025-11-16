import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Färska bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🥞 Creating Saffranspannkaka (helgfrukost) recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const farskabar = await findOrCreateFoodItem('Färska bär')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')
  const saffran = await findOrCreateFoodItem('Saffran')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffranspannkaka (helgfrukost)',
      description: 'Pannkakor med saffran att lyxa till helgfrukosten med.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/CLS6h1FD/2025-11-14-10-31-36-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 493,
      proteinPerServing: 41,
      carbsPerServing: 38,
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
            foodItemId: farskabar.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
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
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: vaniljpulver.id,
            amount: 0.5, // 0.5 krm ≈ 0.5g
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5, // 0.5g
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
            instruction: 'Vispa ihop ägg, havremjöl, vatten, vaniljpulver och saffran',
          },
          {
            stepNumber: 2,
            instruction: 'Stek som tunna pannkakor, strö över lite sötströ, toppa med kvarg och färska bär',
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
