import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs 6%': { calories: 155, protein: 21, carbs: 0, fat: 6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Sparris': { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  'Sambal oelek': { calories: 35, protein: 1.5, carbs: 7, fat: 0.5 },
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
  console.log('🍔 Creating Nötfärsbiffar med potatismos och sparris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs 6%')
  const potatis = await findOrCreateFoodItem('Potatis')
  const sparris = await findOrCreateFoodItem('Sparris')
  const sambaloelek = await findOrCreateFoodItem('Sambal oelek')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Nötfärsbiffar med potatismos och sparris',
      description: 'Heta nötfärs biffar med potatismos och stekt sparris.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/gkByx7Nj/2025-11-14-14-23-02-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 46,
      carbsPerServing: 58,
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
            notes: 'Nötfärs 6 %'
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: sparris.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: sambaloelek.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala potatis och koka upp.',
          },
          {
            stepNumber: 2,
            instruction: 'Förbered färsen genom att knåda in alla kryddor du vill ha. Var inte rädd för att krydda!',
          },
          {
            stepNumber: 3,
            instruction: 'Blöt händerna och forma till biffar. Stek sedan i kokosolja',
          },
          {
            stepNumber: 4,
            instruction: 'Sparrisen sköljor du av och bryter väck den dåliga änden. Stek sedan detta i "skyn" av biffarna så får du en god smak på dessa.',
          },
          {
            stepNumber: 5,
            instruction: 'När potatisen har kokat stompar du den och tillsätter vitpeppar',
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
