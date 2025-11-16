import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Krossade tomater': { calories: 32, protein: 1.2, carbs: 6.3, fat: 0.3 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Steviaketchup': { calories: 20, protein: 0.5, carbs: 4, fat: 0.1 },
  'Färsk koriander': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🍲 Creating Nötfärsgryta recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const ris = await findOrCreateFoodItem('Ris')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater')
  const lok = await findOrCreateFoodItem('Lök')
  const steviaketchup = await findOrCreateFoodItem('Steviaketchup')
  const koriander = await findOrCreateFoodItem('Färsk koriander')
  const vitlok = await findOrCreateFoodItem('Vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Nötfärsgryta',
      description: 'Nötfärsgryta, 1 portion.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/tTKqChVr/2025-11-15-12-32-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 45,
      carbsPerServing: 60,
      fatPerServing: 8,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 152,
            displayAmount: '152',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: krossadeTomater.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: steviaketchup.id,
            amount: 100,
            displayAmount: '1',
            displayUnit: 'dl',
            notes: 'cirka 100ml',
          },
          {
            foodItemId: koriander.id,
            amount: 20,
            displayAmount: '2',
            displayUnit: 'st',
            notes: 'nävar',
          },
          {
            foodItemId: vitlok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Frås till löken som är hackad',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg i nötfärs och tillsätt krossad vitlök samt eventuellt valfri krydda.',
          },
          {
            stepNumber: 3,
            instruction: 'Ta fram en stor gryta, häll över färsen, tillsätt krossade tomater och ketchup',
          },
          {
            stepNumber: 4,
            instruction: 'När allt blivit klart, stäng av värmen och tillsätt koriander sedan rör om.',
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
