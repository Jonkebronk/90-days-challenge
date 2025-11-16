import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kalkonbacon': { calories: 149, protein: 21.5, carbs: 1, fat: 6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Palsternacka': { calories: 75, protein: 1.2, carbs: 18, fat: 0.3 },
  'Rödbetor': { calories: 43, protein: 1.6, carbs: 10, fat: 0.2 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
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
  console.log('🥘 Creating Sandras pytt recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const potatis = await findOrCreateFoodItem('Potatis')
  const palsternacka = await findOrCreateFoodItem('Palsternacka')
  const rodbetor = await findOrCreateFoodItem('Rödbetor')
  const lok = await findOrCreateFoodItem('Lök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Sandras pytt',
      description: 'Supergod pyttipanna med rödbetor.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/1zGYq9kc/2025-11-14-14-03-10-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 59,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kalkonbacon.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 209,
            displayAmount: '209',
            displayUnit: 'g',
          },
          {
            foodItemId: palsternacka.id,
            amount: 110,
            displayAmount: '110',
            displayUnit: 'g',
          },
          {
            foodItemId: rodbetor.id,
            amount: 160,
            displayAmount: '160',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Hacka upp potatis, palsternacka och rödbetor. Sätt in i ugnen på 200 grader till dom är klara.',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka upp lök och kalkonbacon. stek i stekpannan så dom får färg.',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda ihop allt och servera gärna med ett stekt ägg.',
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
