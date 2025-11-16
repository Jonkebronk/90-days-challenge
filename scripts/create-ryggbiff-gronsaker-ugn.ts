import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ryggbiff': { calories: 157, protein: 30, carbs: 0, fat: 3.5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  'Körsbärstomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Färsk vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🥩 Creating Ryggbiff med grönsaker i ugn recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const ryggbiff = await findOrCreateFoodItem('Ryggbiff')
  const potatis = await findOrCreateFoodItem('Potatis')
  const zucchini = await findOrCreateFoodItem('Zucchini')
  const tomater = await findOrCreateFoodItem('Körsbärstomater')
  const vitlok = await findOrCreateFoodItem('Färsk vitlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ryggbiff med grönsaker i ugn',
      description: 'God och enkel måltid, passar bra när man ska lyxa till det!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/k4FDWVCy/2025-11-14-14-16-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: ryggbiff.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: zucchini.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Väg allt till önskad mängd',
          },
          {
            stepNumber: 2,
            instruction: 'Skär potatis, zucchini och körsbärstomater',
          },
          {
            stepNumber: 3,
            instruction: 'Ta lite cocosolja i en ugnssäker form som du bredt ut, häll sedan i potatisen och grönsakerna.',
          },
          {
            stepNumber: 4,
            instruction: 'Toppa potatisen/grönsakerna med hackad vitlök, färska kryddor och svartpeppar samt chayenne',
          },
          {
            stepNumber: 5,
            instruction: 'Kör potatisen/grönsakerna i ugnen ca 40 min. Rör om/vänd dem ett par gånger under tillagningen.',
          },
          {
            stepNumber: 6,
            instruction: 'När potatisen är mjuk kan du steka köttet i lite smakfri cocosolja. Stek utifrån eist önskemål. Peppra med svartpeppar.',
          },
          {
            stepNumber: 7,
            instruction: 'Klart att ätas! :)',
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
