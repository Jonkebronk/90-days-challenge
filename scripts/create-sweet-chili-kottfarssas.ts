import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Köttfärs': { calories: 250, protein: 20, carbs: 0, fat: 18 },
  'Keso': { calories: 98, protein: 12, carbs: 4, fat: 4 },
  'Fin hackad tomatkross': { calories: 32, protein: 1.6, carbs: 7, fat: 0.3 },
  'Röd lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Sweet chili slender sås': { calories: 50, protein: 0.5, carbs: 12, fat: 0.1 },
  'Paprika pulver': { calories: 282, protein: 14, carbs: 54, fat: 13 },
  'Basilika': { calories: 23, protein: 3.2, carbs: 2.7, fat: 0.6 },
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
  console.log('🌶️ Creating Sweet chili köttfärssås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kottfars = await findOrCreateFoodItem('Köttfärs')
  const keso = await findOrCreateFoodItem('Keso')
  const tomatkross = await findOrCreateFoodItem('Fin hackad tomatkross')
  const rodLok = await findOrCreateFoodItem('Röd lök')
  const sweetChili = await findOrCreateFoodItem('Sweet chili slender sås')
  const paprikaPulver = await findOrCreateFoodItem('Paprika pulver')
  const basilika = await findOrCreateFoodItem('Basilika')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Sweet chili köttfärssås',
      description: 'Min goda variant på köttfärssås. Lånade lite keso från ett mellanmål',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/tJSRFL1T/2025-11-15-13-20-35-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 259,
      proteinPerServing: 48,
      carbsPerServing: 7,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kottfars.id,
            amount: 159,
            displayAmount: '159',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatkross.id,
            amount: 120,
            displayAmount: '120',
            displayUnit: 'g',
          },
          {
            foodItemId: rodLok.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: sweetChili.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: paprikaPulver.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: basilika.id,
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
            instruction: 'Stek köttfärs och hackad lök i lite kokosolja',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt sist keson som får smälta in i köttfärssåsen för att få den lite kramigare',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt Sweet chili slendersås och rör om',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt tomatkross och vatten + kryddor och låt puttra i ca 5 minuter',
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
