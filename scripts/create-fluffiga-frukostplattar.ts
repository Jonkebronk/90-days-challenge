import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Kokosolja med smak': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Kvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Keso': { calories: 72, protein: 12.6, carbs: 3.6, fat: 0.6 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Fluffiga frukostplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kokosolja = await findOrCreateFoodItem('Kokosolja med smak')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const keso = await findOrCreateFoodItem('Keso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fluffiga frukostplättar',
      description: 'Lyxiga och mättande plättar som funkar lika bra till vardags som till helg!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/RV7MbGRD/2025-11-14-11-15-28-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 459,
      proteinPerServing: 39,
      carbsPerServing: 35,
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
            foodItemId: kokosolja.id,
            amount: 30, // 2 msk ≈ 30g
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: kvarg.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 75,
            displayAmount: '75',
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
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynen i mixer (ej stavmixer) tills det blir mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg kvargen och keson i behållaren',
          },
          {
            stepNumber: 3,
            instruction: 'Addera ägg',
          },
          {
            stepNumber: 4,
            instruction: 'Späd med vatten',
          },
          {
            stepNumber: 5,
            instruction: 'Mixa till slät smet',
          },
          {
            stepNumber: 6,
            instruction: 'Hetta upp pannan ordentligt och stek i kokosolja',
          },
          {
            stepNumber: 7,
            instruction: 'Servera nystekta med kvarg som blev över och färska bär!',
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
