import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 17, carbs: 0, fat: 20 },
  'Keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Kungsornen rågmjöl': { calories: 323, protein: 8.4, carbs: 69, fat: 1.7 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Riven morot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'Bakpulver': { calories: 53, protein: 0, carbs: 28, fat: 0 },
  'Ägg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
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
  console.log('🥟 Creating Köttfärspiroger recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const keso = await findOrCreateFoodItem('Keso')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const ragmjol = await findOrCreateFoodItem('Kungsornen rågmjöl')
  const lok = await findOrCreateFoodItem('Lök')
  const morot = await findOrCreateFoodItem('Riven morot')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const agg = await findOrCreateFoodItem('Ägg')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttfärspiroger',
      description: 'Perfekt att frysa in färdiga, för att ta upp när det är ont om tid!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/rFwGNMrq/2025-11-15-12-05-40-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 45,
      carbsPerServing: 61,
      fatPerServing: 7,
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
            foodItemId: keso.id,
            amount: 35,
            displayAmount: '35',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: ragmjol.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
            notes: 'Spara lite till utbakningen'
          },
          {
            foodItemId: lok.id,
            amount: 116,
            displayAmount: '116',
            displayUnit: 'g',
          },
          {
            foodItemId: morot.id,
            amount: 84,
            displayAmount: '84',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: agg.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
            notes: 'Till pensling'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Hacka löken och vitlöken, fräs mjuk och tillsätt rivna morötten.',
          },
          {
            stepNumber: 2,
            instruction: 'Bryn nötfärs, tillsätt sedan löken, vitlöken och moröttterna och blanda ner tomatpurén och keson. Krydda efter egen smak. Ta av från plåttan och låt svalna.',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda rågmjölet, rismjölet och bakpulver väl. Tillsätt vatten, men var försiktig, det får inte vara för torrt eller löst.',
          },
          {
            stepNumber: 4,
            instruction: 'Kavla ut degen ganska tunt. Sprid ut färsen på ena sidan och vik över degen. Det kan hjälpa att ha lite vatten som "lim" mellan degen för att få det att fästa. Tryck sedan ihop med gaffel.',
          },
          {
            stepNumber: 5,
            instruction: 'Vispa ett ägg och pensla på pirogerna. Och in i mitten av ugnen i 15 min på 225 grader.',
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
