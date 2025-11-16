import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon (eller blåbär)': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Kvarg med hallonsmak (eller blåbär)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🫐 Creating Hallonscones (eller blåbär) recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hallon = await findOrCreateFoodItem('Hallon (eller blåbär)')
  const kvarg = await findOrCreateFoodItem('Kvarg med hallonsmak (eller blåbär)')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Hallonscones (eller blåbär)',
      description: 'Beroendeframkallande scones med bärsmak',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/kMpB9VNF/2025-11-14-10-34-36-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 301,
      proteinPerServing: 24,
      carbsPerServing: 36,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallon.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
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
            instruction: 'Blanda alla ingredienser till en smet. Sötströ behövs bara om man vill ha lite extra sötma. Bär kan man ta efter behag ca 0.5-1 dl. Man kan antingen ta färska, frysta eller micra dem till "sylt" innan man häller i dom i smeten',
          },
          {
            stepNumber: 2,
            instruction: 'Smorj ett bakplåtspapper med lite kokosolja',
          },
          {
            stepNumber: 3,
            instruction: 'Forma smeten till två små bullar eller en stor och grädda i ugnen på 200 grader i ca 20 minuter',
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
