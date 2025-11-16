import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Keso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Fryste blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sukrin': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥣 Creating Frokostgröt recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const keso = await findOrCreateFoodItem('Keso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const frysteblåbär = await findOrCreateFoodItem('Fryste blåbär')
  const vatten = await findOrCreateFoodItem('Vatten')
  const sukrin = await findOrCreateFoodItem('Sukrin')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frokostgröt',
      description: 'Proteinrik frokost som gi en bra start på dagen.',
      categoryId: category.id,
      servings: 1,
      coverImage: '',
      caloriesPerServing: 289,
      proteinPerServing: 24,
      carbsPerServing: 34,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: keso.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 43,
            displayAmount: '43',
            displayUnit: 'g',
          },
          {
            foodItemId: frysteblåbär.id,
            amount: 43,
            displayAmount: '43',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: sukrin.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Bland alt sammen på kvelden og sett i kylen over natten. Voilà, en god frokost og bra start på dagen!',
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
