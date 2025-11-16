import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kalkonbacon': { calories: 149, protein: 21.5, carbs: 1, fat: 6 },
  'Keso mini': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Sötpotatis': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'Champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Cocktailtomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Röd paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Röd lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Salladsärtor': { calories: 42, protein: 2.8, carbs: 7.5, fat: 0.2 },
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
  console.log('🥔 Creating Bakad sötpotatis med kalkonbacon och keso recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const keso = await findOrCreateFoodItem('Keso mini')
  const sotpotatis = await findOrCreateFoodItem('Sötpotatis')
  const champinjoner = await findOrCreateFoodItem('Champinjoner')
  const cocktailtomater = await findOrCreateFoodItem('Cocktailtomater')
  const rodpaprika = await findOrCreateFoodItem('Röd paprika')
  const rodlok = await findOrCreateFoodItem('Röd lök')
  const salladsartor = await findOrCreateFoodItem('Salladsärtor')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Bakad sötpotatis med kalkonbacon och keso',
      description: 'Ugnsbakade sötpotatishalvor med kalkonbacon och grönsaker toppade med keso.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/gJ3t3G1g/2025-11-14-13-54-04-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 51,
      carbsPerServing: 67,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kalkonbacon.id,
            amount: 134,
            displayAmount: '134',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: sotpotatis.id,
            amount: 292,
            displayAmount: '292',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: cocktailtomater.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: rodpaprika.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: salladsartor.id,
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
            instruction: 'Sätt ugnen på 225 grader. Skölj av och dela sötpotatisen i halvor.',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg sötpotatishalvorna på en bakplåtsklädd form och pensla lite fett med rapsolja. Baka potatisen i ugnen ca 25 min tills den är mjuk.',
          },
          {
            stepNumber: 3,
            instruction: 'Stek kalkonbacon och champinjoner.',
          },
          {
            stepNumber: 4,
            instruction: 'Ta ut sötpotatisen ur ugnen och lägg halvorna på en tallrik. Toppa med kalkonbacon och champinjoner.',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg på önskad mängd av grönsaker och några klickar med keso.',
          },
          {
            stepNumber: 6,
            instruction: 'Smaka av med svartpeppar.',
          },
          {
            stepNumber: 7,
            instruction: 'Smaklig måltid!',
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
