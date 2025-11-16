import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Jordnötssmör, eller valfritt nötsmör': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'Keso, lätt': { calories: 72, protein: 12.6, carbs: 3.6, fat: 0.6 },
  'Durummjöl': { calories: 339, protein: 13, carbs: 70, fat: 1.5 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍞 Creating Ostbröd med nötsmör recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const jordnotssmor = await findOrCreateFoodItem('Jordnötssmör, eller valfritt nötsmör')
  const keso = await findOrCreateFoodItem('Keso, lätt')
  const durummjol = await findOrCreateFoodItem('Durummjöl')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const salt = await findOrCreateFoodItem('Salt')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ostbröd med nötsmör',
      description: 'Supergod frukostbröd till helgen eller när du vill äta hela frukosten smidigt på språng',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/rs9SfxYS/2025-11-14-11-11-01-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 478,
      proteinPerServing: 29,
      carbsPerServing: 43,
      fatPerServing: 21,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: jordnotssmor.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 142,
            displayAmount: '142',
            displayUnit: 'g',
          },
          {
            foodItemId: durummjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: salt.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Häll ner de torra ingredienserna i en skål och blanda',
          },
          {
            stepNumber: 2,
            instruction: 'Tillsätt keso och nötsmör',
          },
          {
            stepNumber: 3,
            instruction: 'Mosa keson lätt med en gaffel och rör ihop allt till en deg likt scones',
          },
          {
            stepNumber: 4,
            instruction: 'Forma till 1 fralla',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda mitt i ugnen på 175-200grader i 15-20 minuter eller tills brödet är gyllenbrun och det ser ut som smält, gratinerad ost på ytan',
          },
          {
            stepNumber: 6,
            instruction: 'Servera och njut',
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
