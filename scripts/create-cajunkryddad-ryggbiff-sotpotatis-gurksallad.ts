import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ryggbiff': { calories: 143, protein: 20, carbs: 0, fat: 7 },
  'Sötpotatis': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'Salladslökar': { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2 },
  'Gurka': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  'Majs': { calories: 86, protein: 3.3, carbs: 19, fat: 1.4 },
  'Limejuice': { calories: 25, protein: 0.4, carbs: 8.4, fat: 0.1 },
  'Röd chili': { calories: 40, protein: 1.9, carbs: 8.8, fat: 0.4 },
  'Cajunkrydda': { calories: 250, protein: 10, carbs: 50, fat: 5 },
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
  console.log('🌶️ Creating Cajunkryddad ryggbiff med sötpotatis och gurksallad recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const ryggbiff = await findOrCreateFoodItem('Ryggbiff')
  const sotpotatis = await findOrCreateFoodItem('Sötpotatis')
  const salladslok = await findOrCreateFoodItem('Salladslökar')
  const gurka = await findOrCreateFoodItem('Gurka')
  const majs = await findOrCreateFoodItem('Majs')
  const limejuice = await findOrCreateFoodItem('Limejuice')
  const rodChili = await findOrCreateFoodItem('Röd chili')
  const cajunkrydda = await findOrCreateFoodItem('Cajunkrydda')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Cajunkryddad ryggbiff med sötpotatis och gurksallad',
      description: 'En lyxig helgrätt med mycket smak',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/v8PrZTPG/2025-11-15-13-04-53-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 472,
      proteinPerServing: 50,
      carbsPerServing: 62,
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
            foodItemId: sotpotatis.id,
            amount: 292,
            displayAmount: '292',
            displayUnit: 'g',
          },
          {
            foodItemId: salladslok.id,
            amount: 109,
            displayAmount: '109',
            displayUnit: 'st',
          },
          {
            foodItemId: gurka.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: majs.id,
            amount: 91,
            displayAmount: '91',
            displayUnit: 'g',
          },
          {
            foodItemId: limejuice.id,
            amount: 4,
            displayAmount: '0.25',
            displayUnit: 'msk',
          },
          {
            foodItemId: rodChili.id,
            amount: 2.5,
            displayAmount: '2.5',
            displayUnit: 'g',
          },
          {
            foodItemId: cajunkrydda.id,
            amount: 7.5,
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda 2 msk cajunkrydda med 2 msk rapsolja. Häll blandningen över ryggbiffen och låt ligga i 30 min',
          },
          {
            stepNumber: 2,
            instruction: 'Skala och dela sotpotatisen i 2-3 cm tjocka skivor. Krydda med svartpeppar (och salt, kan uteslutas). Lägg i en ugnsform och sätt in ugnen på 225 grader i ca 40 min',
          },
          {
            stepNumber: 3,
            instruction: 'Finhacka chili och strimla salladslöken. Häll av majsen. Stek i lite olja i en het panna under omrorning i ca 3 minuter tills majsen ar gryllene',
          },
          {
            stepNumber: 4,
            instruction: 'Ta bort majsblandningen från värmen och lägg i en bunke. Tillsätt limejuice och låt svalna',
          },
          {
            stepNumber: 5,
            instruction: 'Finhacka gurkan och blanda i majsblandningen tillsammans med salladslök och koriander',
          },
          {
            stepNumber: 6,
            instruction: 'Stek ryggbiffen till önskad stekgrad (ca 3 min per sida för medium)',
          },
          {
            stepNumber: 7,
            instruction: 'Servera ryggbiff tillsammans med sötpotatis och salladen',
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
