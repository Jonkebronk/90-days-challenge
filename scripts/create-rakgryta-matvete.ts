import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Räkor': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  'Matvete': { calories: 340, protein: 13, carbs: 70, fat: 2 },
  'Haricots verts': { calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Krossade tomater': { calories: 32, protein: 1.2, carbs: 6.3, fat: 0.3 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Curry': { calories: 325, protein: 14, carbs: 55, fat: 14 },
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
  console.log('🦐 Creating Räkgryta med matvete recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Räkor')
  const matvete = await findOrCreateFoodItem('Matvete')
  const haricotsVerts = await findOrCreateFoodItem('Haricots verts')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const curry = await findOrCreateFoodItem('Curry')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Räkgryta med matvete',
      description: 'Kryddig räkgryta som tillagas på nolltid.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/W3Xy5jsg/2025-11-15-12-47-12-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: rakor.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: matvete.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: haricotsVerts.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: krossadeTomater.id,
            amount: 120,
            displayAmount: '120',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'g',
          },
          {
            foodItemId: curry.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Hacka lök och vitlök o frås i kokosolja',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg i frysta haricots verts och stek lite',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg i krossade tomater och räkor',
          },
          {
            stepNumber: 4,
            instruction: 'Låt puttra/småkoka i några minuter',
          },
          {
            stepNumber: 5,
            instruction: 'Servera med matvete/ris',
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
