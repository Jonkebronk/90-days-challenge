import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Grillad kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gröna bönor': { calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  'Slenderchef barbeque': { calories: 30, protein: 0.5, carbs: 6, fat: 0.3 },
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
  console.log('🍗 Creating Grillad kyckling med klyftpotatis recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const grilladKyckling = await findOrCreateFoodItem('Grillad kyckling')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gronaBonor = await findOrCreateFoodItem('Gröna bönor')
  const barbeque = await findOrCreateFoodItem('Slenderchef barbeque')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Grillad kyckling med klyftpotatis',
      description: 'Enkelt, smidigt och gott',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/KY9VNxGL/2025-11-15-12-50-06-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: grilladKyckling.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gronaBonor.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: barbeque.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skär potatisen i klyftor. Krydda med salt, peppar och rosmarin. Tillaga i ugnen.',
          },
          {
            stepNumber: 2,
            instruction: 'Ansa kycklingen',
          },
          {
            stepNumber: 3,
            instruction: 'Värm gröna bönor',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg upp på tallrik och ringla över bbq såsen!!',
          },
          {
            stepNumber: 5,
            instruction: 'Enjoy!',
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
