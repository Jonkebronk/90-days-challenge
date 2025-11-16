import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Bladspenat': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  'Babytomat': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Silverlök': { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
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
  console.log('🍗 Creating Kyckling onepot recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const bladspenat = await findOrCreateFoodItem('Bladspenat')
  const babytomat = await findOrCreateFoodItem('Babytomat')
  const silverlok = await findOrCreateFoodItem('Silverlök')
  const paprika = await findOrCreateFoodItem('Paprika')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kyckling onepot',
      description: 'Smidig rätt där allt görs i stekpanna.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/MG5mwvk4/2025-11-14-14-04-44-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
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
            foodItemId: bladspenat.id,
            amount: 53,
            displayAmount: '53',
            displayUnit: 'g',
          },
          {
            foodItemId: babytomat.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: silverlok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
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
            instruction: 'Koka upp ris enligt anvisning och skär upp alla ingredienser till önskad storlek',
          },
          {
            stepNumber: 2,
            instruction: 'Stek kyckling, lök och paprika',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg i det färdigkokta riset i stekpannan och stek en liten stund',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg i tomat och bladspenat ett par minuter',
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
