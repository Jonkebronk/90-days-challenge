import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Vaniljkvarg (valfritt med smak)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Valfri mängd med kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
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
  console.log('🥧 Creating Blåbär/hallon paj recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const bar = await findOrCreateFoodItem('Bär')
  const agg = await findOrCreateFoodItem('Ägg')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg (valfritt med smak)')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const kanel = await findOrCreateFoodItem('Valfri mängd med kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Blåbär/hallon paj',
      description: 'Detta är ett perfekt frukost tips där alla frukost ingridienser är samlade i en god kompott.',
      categoryId: category.id,
      servings: 1,
      coverImage: '',
      caloriesPerServing: 490,
      proteinPerServing: 40,
      carbsPerServing: 37,
      fatPerServing: 18,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: bar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: kanel.id,
            amount: 0,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ihop Havregryn, Ägg Kvarg',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda i kanel efter tycke och smak',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg bären i en form, och lägg blandningen över bären',
          },
          {
            stepNumber: 4,
            instruction: 'Ställ in i ugnen på 200grader i 10min ca',
          },
          {
            stepNumber: 5,
            instruction: 'Servera med resterande av kvargen som du har kvar i ditt mål så blir det som en god vaniljsås till denna goda paj',
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
