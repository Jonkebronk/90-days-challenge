import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Avokado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  'Lärsas Yoghurt': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Räkor i lake': { calories: 80, protein: 18, carbs: 1, fat: 1 },
  'Oldas risbröd': { calories: 380, protein: 8, carbs: 82, fat: 2 },
  'Färskpressad lime': { calories: 30, protein: 0.7, carbs: 8.4, fat: 0.2 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Vitpeppar': { calories: 296, protein: 10.4, carbs: 68.5, fat: 2.1 },
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
  console.log('🥪 Creating Räksmörgås med guacamole recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const avokado = await findOrCreateFoodItem('Avokado')
  const larsasyoghurt = await findOrCreateFoodItem('Lärsas Yoghurt')
  const rakorilake = await findOrCreateFoodItem('Räkor i lake')
  const oldasrisbrod = await findOrCreateFoodItem('Oldas risbröd')
  const farskpressadlime = await findOrCreateFoodItem('Färskpressad lime')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const vitpeppar = await findOrCreateFoodItem('Vitpeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Räksmörgås med guacamole',
      description: 'Mycket snabblagat och smakrikt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/5N11hL61/2025-11-14-10-57-09-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 28,
      carbsPerServing: 34,
      fatPerServing: 23,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: avokado.id,
            amount: 93,
            displayAmount: '93',
            displayUnit: 'g',
          },
          {
            foodItemId: larsasyoghurt.id,
            amount: 89,
            displayAmount: '89',
            displayUnit: 'g',
          },
          {
            foodItemId: rakorilake.id,
            amount: 45,
            displayAmount: '45',
            displayUnit: 'g',
          },
          {
            foodItemId: oldasrisbrod.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: farskpressadlime.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: vitlok.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: vitpeppar.id,
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
            instruction: 'Mosa den mogna avokaden. Blir godast med lite klumpar därför mixar jag den sällan. Blanda i lärsas youghurt, vitlök och limen. Smaka av med lite peppar. Lägg upp guacamolen på risbröden och toppa med räkor och grönsaker.',
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
