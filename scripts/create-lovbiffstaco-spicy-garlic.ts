import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Lövbiff': { calories: 143, protein: 20, carbs: 0, fat: 7 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Sallad, gurka, paprika, tomat, rödlök': { calories: 20, protein: 1, carbs: 4, fat: 0.2 },
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
  console.log('🌮 Creating Lövbiffstaco med spicy garlic sås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const lovbiff = await findOrCreateFoodItem('Lövbiff')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const sallad = await findOrCreateFoodItem('Sallad, gurka, paprika, tomat, rödlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Lövbiffstaco med spicy garlic sås från slenders',
      description: 'Lövbiffstaco med spicy garlic sås',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/rwQP9Mgq/2025-11-15-12-25-02-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: lovbiff.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: sallad.id,
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
            instruction: 'Stek lövbiffen med paprika',
          },
          {
            stepNumber: 2,
            instruction: 'Krydda med vitlökspulver, paprikapulver, chilli, peppar och spiskummin',
          },
          {
            stepNumber: 3,
            instruction: 'Häll i en skvätt vatten.',
          },
          {
            stepNumber: 4,
            instruction: 'Börja sedan med brödet.',
          },
          {
            stepNumber: 5,
            instruction: 'Sätt ugnen på 220grader.',
          },
          {
            stepNumber: 6,
            instruction: 'Ta 60gram rismjöl med cirka 4 msk vatten, paprikapulver och vitlökspulver och blanda allt.',
          },
          {
            stepNumber: 7,
            instruction: 'Gör allt till den deg och dela sedan i två delar.',
          },
          {
            stepNumber: 8,
            instruction: 'Tryck ut degen på en plåt med bakplåtspapper med lite kokosolja under så att det inte fastnar.',
          },
          {
            stepNumber: 9,
            instruction: 'Låt vara i ugnen cirka 6-8 minuter sedan vänd på bröder och låt vara tills det ser bra ut.',
          },
          {
            stepNumber: 10,
            instruction: 'Ta ut från ugnen och lägg på lövbiffen, salladen och toppa med spicy garlic såsen!',
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
