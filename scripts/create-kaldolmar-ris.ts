import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mager köttfärs': { calories: 151, protein: 20, carbs: 0, fat: 7.5 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Vitkålsblad': { calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
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
  console.log('🥬 Creating Kåldolmar med ris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kottfars = await findOrCreateFoodItem('Mager köttfärs')
  const ris = await findOrCreateFoodItem('Ris')
  const vitkal = await findOrCreateFoodItem('Vitkålsblad')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kåldolmar med ris',
      description: 'Enkla och goda kåldolmar',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/SKxjwxmR/2025-11-15-12-08-45-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kottfars.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: vitkal.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Dra av blad från en vitkål, skär bort den hårda kanten nertill. Koka vitkålsbladen så de blir lite mjuka.',
          },
          {
            stepNumber: 2,
            instruction: 'Stek undertiden köttfärs och krydda efter smak.',
          },
          {
            stepNumber: 3,
            instruction: 'Fördela upp köttfärsen mellan vitkålsbladen och vik och rulla sedan ihop och lägg i en form. Och grädda i ugnen på 220grader tills de fått lite färg',
          },
          {
            stepNumber: 4,
            instruction: 'Koka undertiden ris till.',
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
