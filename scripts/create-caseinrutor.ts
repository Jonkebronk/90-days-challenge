import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Jordnötssmör': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'Färska jordgubbar': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  'Vaniljsås casein': { calories: 385, protein: 80, carbs: 8, fat: 3 },
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
  console.log('🍫 Creating Caseinrutor recipe...\n')

  // Find Mellanmål category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'mellanmal' }
  })

  if (!category) {
    throw new Error('Mellanmål category not found')
  }

  // Create or find all food items
  const jordnotssmor = await findOrCreateFoodItem('Jordnötssmör')
  const farskaJordgubbar = await findOrCreateFoodItem('Färska jordgubbar')
  const vaniljsasCasein = await findOrCreateFoodItem('Vaniljsås casein')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Caseinrutor',
      description: 'Jätteenkelt och gott recept på några få ingredienser.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/CLhDFvK9/2025-11-14-12-41-38-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 271,
      proteinPerServing: 24,
      carbsPerServing: 12,
      fatPerServing: 15,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: jordnotssmor.id,
            amount: 27,
            displayAmount: '27',
            displayUnit: 'g',
          },
          {
            foodItemId: farskaJordgubbar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljsasCasein.id,
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
            instruction: 'Mät upp caseinet i en skål och tillsätt sen vatten tills du får en bra smet. Inte för tunn & inte för tjock.',
          },
          {
            stepNumber: 2,
            instruction: 'Ha i jordnötssmöret och blanda väl.',
          },
          {
            stepNumber: 3,
            instruction: 'Ta en fryspåse och lägg i smeten där. Platta till så det blir som en stor kaka.',
          },
          {
            stepNumber: 4,
            instruction: 'In i frysen i någon timme',
          },
          {
            stepNumber: 5,
            instruction: 'Ta ut den och skär rutor av kakan.',
          },
          {
            stepNumber: 6,
            instruction: 'Mosa jordgubbarna och lägg sedan på lite på varje ruta. NJUT sen!',
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
