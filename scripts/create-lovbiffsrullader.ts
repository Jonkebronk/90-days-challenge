import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Lövbiff': { calories: 143, protein: 20, carbs: 0, fat: 7 },
  'Keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
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
  console.log('🥩 Creating Lövbiffsrullader recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const lovbiff = await findOrCreateFoodItem('Lövbiff')
  const keso = await findOrCreateFoodItem('Keso')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Lövbiffsrullader',
      description: 'Lövbiffsrullader med kesoröra.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/VsRPpBHm/2025-11-15-11-53-40-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 46,
      carbsPerServing: 53,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: lovbiff.id,
            amount: 157,
            displayAmount: '157',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 35,
            displayAmount: '35',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
            notes: 'Att äta utöver receptet (för en komplett lunch)'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200 grader. Skär potatis i klyftor och lägg dom i blöt en stund (gör så att potatsen inte fastnar i botten). Rosta potatisen i ugnen i ca 25-30 min.',
          },
          {
            stepNumber: 2,
            instruction: 'Banka ut lövbiffen så den blir platt. Blanda ihop keso, vitlök och persilja och lägg på lövbiffen. Rulla sedan ihop den och sätt ihop den med en tandpetare',
          },
          {
            stepNumber: 3,
            instruction: 'Stek rulladerna tills alla sidor fått fin färg.',
          },
          {
            stepNumber: 4,
            instruction: 'Häll på lite vatten i stekpannan, sätt på ett lock, sänk värmen och låt rulladerna ångas i ca 5 min.',
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
