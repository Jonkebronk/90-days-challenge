import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 172, protein: 20, carbs: 0, fat: 10 },
  'Kikärtspasta': { calories: 337, protein: 20, carbs: 55, fat: 6 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 7, fat: 0.3 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Curry': { calories: 325, protein: 14, carbs: 55, fat: 14 },
  'Oregano': { calories: 265, protein: 9, carbs: 69, fat: 4.3 },
  'Peppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Timjan': { calories: 101, protein: 5.6, carbs: 24, fat: 1.7 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
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
  console.log('🍗 Creating Kycklingbullar i tomatsås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const kikartspasta = await findOrCreateFoodItem('Kikärtspasta')
  const krossadeTomater = await findOrCreateFoodItem('Krossade tomater')
  const lok = await findOrCreateFoodItem('Lök')
  const vatten = await findOrCreateFoodItem('Vatten')
  const curry = await findOrCreateFoodItem('Curry')
  const oregano = await findOrCreateFoodItem('Oregano')
  const peppar = await findOrCreateFoodItem('Peppar')
  const timjan = await findOrCreateFoodItem('Timjan')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kycklingbullar i tomatsås',
      description: 'Kycklingbullar gjorda på kycklingfärs i tomatsås med kikärtspasta',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/CxMHhD0z/2025-11-15-13-18-25-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: kikartspasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: krossadeTomater.id,
            amount: 144,
            displayAmount: '144',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 56,
            displayAmount: '56',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100,
            displayAmount: '1',
            displayUnit: 'dl',
            notes: 'vid behov',
          },
          {
            foodItemId: curry.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: oregano.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: peppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: timjan.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: kanel.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Krydda färsen med curry, peppar och oregano. Forma till små runda bollar. Ca 6 st.',
          },
          {
            stepNumber: 2,
            instruction: 'Stek bullarna i kokosolja så att de blir gryllene bruna. Ta bort från stekpannan och lägg åt sidan.',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka lök och stek i samma panna som bullarna. Tillsätt krossade tomater och vatten vid behov',
          },
          {
            stepNumber: 4,
            instruction: 'Krydda såsen med timjan och kanel. Eventuellt oregano beroende på vad man gillar.',
          },
          {
            stepNumber: 5,
            instruction: 'När du är nöjd med såsen kan du lägga tillbaka bullarna och låt puttra en liten stund.',
          },
          {
            stepNumber: 6,
            instruction: 'Koka pastan enligt anvisning',
          },
          {
            stepNumber: 7,
            instruction: 'Smaklig måltid',
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
