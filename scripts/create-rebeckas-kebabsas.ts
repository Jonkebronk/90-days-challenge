import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Äggula': { calories: 322, protein: 16, carbs: 3.6, fat: 27 },
  'Fun light orange': { calories: 1, protein: 0, carbs: 0.2, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kvarg': { calories: 66, protein: 11, carbs: 4, fat: 0.2 },
  'Vitlöksklyftor': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Chilipulver': { calories: 282, protein: 13, carbs: 50, fat: 15 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Cayennepeppar': { calories: 318, protein: 12, carbs: 57, fat: 17 },
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
  console.log('🥫 Creating Rebeckas kebabsås recipe...\n')

  // Find Sås category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'sas' }
  })

  if (!category) {
    throw new Error('Sås category not found')
  }

  // Create or find all food items
  const aggula = await findOrCreateFoodItem('Äggula')
  const funLight = await findOrCreateFoodItem('Fun light orange')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const kvarg = await findOrCreateFoodItem('Kvarg')
  const vitloksklyftor = await findOrCreateFoodItem('Vitlöksklyftor')
  const chilipulver = await findOrCreateFoodItem('Chilipulver')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const cayennepeppar = await findOrCreateFoodItem('Cayennepeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Rebeckas kebabsås',
      description: 'Supergod lättlagad kebabsås - perfekt på kebabpizzan, kebabtallriken eller som dipp.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/3rcd4v2W/2025-11-15-13-29-06-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 150,
      proteinPerServing: 15,
      carbsPerServing: 8,
      fatPerServing: 6,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: aggula.id,
            amount: 50,
            displayAmount: '1',
            displayUnit: 'st',
            notes: '50g',
          },
          {
            foodItemId: funLight.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
            notes: 'eller fanta zero',
          },
          {
            foodItemId: sotstro.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kvarg.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: vitloksklyftor.id,
            amount: 6,
            displayAmount: '2',
            displayUnit: 'klyftor',
          },
          {
            foodItemId: chilipulver.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: cayennepeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda kvargen och äggulan',
          },
          {
            stepNumber: 2,
            instruction: 'Pressa vitlöksklyftan och blanda i',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt fun light orange',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt resterande kryddor',
          },
          {
            stepNumber: 5,
            instruction: 'Späd ev med vatten till önskad konsistens',
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
