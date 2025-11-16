import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Tyngre kasein gammaldags vanilj': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Fiberhavregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Riven morot': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
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
  console.log('🥣 Creating Overnight oats-Morotskaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const tyngrekasein = await findOrCreateFoodItem('Tyngre kasein gammaldags vanilj')
  const fiberhavregryn = await findOrCreateFoodItem('Fiberhavregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const rivenmorot = await findOrCreateFoodItem('Riven morot')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Overnight oats-Morotskaka',
      description: 'Supergod frukostgröt om man gillar morotskaka! Brukar göra en batch för 3-4 dagar åt gången.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/RFX826Yk/2025-11-14-11-05-57-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 293,
      proteinPerServing: 27,
      carbsPerServing: 31,
      fatPerServing: 6,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: tyngrekasein.id,
            amount: 29,
            displayAmount: '29',
            displayUnit: 'g',
          },
          {
            foodItemId: fiberhavregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 200, // 2 dl = 200ml
            displayAmount: '2',
            displayUnit: 'dl',
          },
          {
            foodItemId: rivenmorot.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: kanel.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: kardemumma.id,
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
            instruction: 'Blanda alla ingredienser i en burk med lock',
          },
          {
            stepNumber: 2,
            instruction: 'Skaka eller rör ordentligt',
          },
          {
            stepNumber: 3,
            instruction: 'Ställ i kylen över natten',
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
