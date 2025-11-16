import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Keso': { calories: 72, protein: 12.6, carbs: 3.6, fat: 0.6 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🥧 Creating Nyttig smulpaj! recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const blabar = await findOrCreateFoodItem('Blåbär')
  const keso = await findOrCreateFoodItem('Keso')
  const havregryn = await findOrCreateFoodItem('Havregryn')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Nyttig smulpaj!',
      description: 'Det här är en nyttig variant av smulpaj! Funkar bra till frukost eller efterrätt.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/Pr9m2XS2/2025-11-14-11-20-36-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: blabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
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
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda keso och havregryn i en bunke',
          },
          {
            stepNumber: 3,
            instruction: 'Häll blåbären i en ugnssäker form',
          },
          {
            stepNumber: 4,
            instruction: 'Häll över keso och havregryns blandningen över blåbären',
          },
          {
            stepNumber: 5,
            instruction: 'Strö över lite kanel eller stevia om så önskas',
          },
          {
            stepNumber: 6,
            instruction: 'Ställ in i ugnen 15-20 minuter',
          },
          {
            stepNumber: 7,
            instruction: 'Färdig att ätas!',
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
