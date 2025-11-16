import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Mandlar': { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Minikeso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
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
  console.log('🧀 Creating Ostkaka utan havregryn recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const mandlar = await findOrCreateFoodItem('Mandlar')
  const agg = await findOrCreateFoodItem('Ägg')
  const minikeso = await findOrCreateFoodItem('Minikeso')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ostkaka utan havregryn',
      description: 'Ostkaka gjord på ingredienserna från 2st mellanmål.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/8Pc5KxcC/2025-11-14-12-43-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 254,
      proteinPerServing: 25,
      carbsPerServing: 9,
      fatPerServing: 13,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: mandlar.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 49,
            displayAmount: '49',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 131,
            displayAmount: '131',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200grader',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka mandlarna',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda ägg, minikeso och de hackade mandlarna',
          },
          {
            stepNumber: 4,
            instruction: 'Smörj en form med kokosolja och häll i smeten (jag fördelade smeten i 2st formar = 2st mellanmål).',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda mitt i ugnen i ca 25 minuter eller tills kakan har fått önskad färg.',
          },
          {
            stepNumber: 6,
            instruction: 'Låt kakan svalna något innan du äter den eller förvara den i kylen tills dagen efter.',
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
