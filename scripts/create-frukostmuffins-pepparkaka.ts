import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Blåbär, Hallon, Lingon eller annat bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten till att göra en gröt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
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
  console.log('🧁 Creating Frukostmuffins (mjuk pepparkaka med vaniljsås) recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const bar = await findOrCreateFoodItem('Blåbär, Hallon, Lingon eller annat bär')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten till att göra en gröt')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostmuffins (mjuk pepparkaka med vaniljsås)',
      description: 'Mättande frukostmuffin, lite som en mjuk pepparkaka :)',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PxJmqgC6/2025-11-14-10-23-18-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 376,
      proteinPerServing: 21,
      carbsPerServing: 32,
      fatPerServing: 17,
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
            amount: 40,
            displayAmount: '40',
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
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: kardemumma.id,
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
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka upp en havregrynsgröt på havregryn och vatten (mängd vatten efter önskad konsistens) inte för lös',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ner Kardemumma, Kanel och Ägg i gröten. Vänd sedan ner bären',
          },
          {
            stepNumber: 3,
            instruction: 'Häll upp i en mindre ugnsform och in i ugnen på ca 225grader, tills muffinsen fått fin färg ca 20 min',
          },
          {
            stepNumber: 4,
            instruction: 'Spara den under en bakduk tills morgonens frukost. Servera den med vanilj kvarg eller Barebells Proteinpudding vanilj :) Precis som en mjuk pepparkaka med vaniljsås ?',
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
