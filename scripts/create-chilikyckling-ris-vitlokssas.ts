import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Arlas grekiska yoghurt': { calories: 60, protein: 10, carbs: 4, fat: 0.2 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'Hackad gurka': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Färsk röd chili': { calories: 40, protein: 1.9, carbs: 8.8, fat: 0.4 },
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
  console.log('🌶️ Creating Chilikyckling & ris med vitlökssås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const grekiskYoghurt = await findOrCreateFoodItem('Arlas grekiska yoghurt')
  const ris = await findOrCreateFoodItem('Ris')
  const broccoli = await findOrCreateFoodItem('Broccoli')
  const hackadGurka = await findOrCreateFoodItem('Hackad gurka')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const farskChili = await findOrCreateFoodItem('Färsk röd chili')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Chilikyckling & ris med vitlökssås',
      description: 'Med lite fantasi med kryddningen så blir en enkel rätt magiskt gott!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/kX6nRYyQ/2025-11-15-12-56-55-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 508,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
          {
            foodItemId: grekiskYoghurt.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
            notes: 'cirka 30ml',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: broccoli.id,
            amount: 198,
            displayAmount: '198',
            displayUnit: 'g',
          },
          {
            foodItemId: hackadGurka.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: vitlok.id,
            amount: 3,
            displayAmount: '1.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: farskChili.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka ris enligt anvisningen på förpackningen.',
          },
          {
            stepNumber: 2,
            instruction: 'Skär kycklingen i vafri storlek. Blanda i alla kryddor tillsammans med färska chiliin och vitlöken. Stek tills kycklingen inte är rosa.',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka broccoliin och stek tills den har mjuknat.',
          },
          {
            stepNumber: 4,
            instruction: 'Blanda ihop grekiskt yoghurt med lite vitlök, hackad gurka och lite paprika krydda.',
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
