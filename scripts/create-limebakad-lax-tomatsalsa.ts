import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Lax': { calories: 208, protein: 20, carbs: 0, fat: 13.4 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Tomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Sambal oelek': { calories: 40, protein: 1, carbs: 8, fat: 0.5 },
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
  console.log('🐟 Creating Limebakad lax med tomatsalsa recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const lax = await findOrCreateFoodItem('Lax')
  const ris = await findOrCreateFoodItem('Ris')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const tomater = await findOrCreateFoodItem('Tomater')
  const sambalOelek = await findOrCreateFoodItem('Sambal oelek')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Limebakad lax med tomatsalsa',
      description: 'Vardagslyx med lite sting.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/mD8kLcyK/2025-11-15-12-29-19-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 32,
      carbsPerServing: 60,
      fatPerServing: 14,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: lax.id,
            amount: 104,
            displayAmount: '104',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: sambalOelek.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200°C',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg laxfilén i en ugnsform och peppra.',
          },
          {
            stepNumber: 3,
            instruction: 'Finnly det yttersta skalet från limen och strö över laxen.',
          },
          {
            stepNumber: 4,
            instruction: 'Tillaga mitt i ugnen ca 20 minuter.',
          },
          {
            stepNumber: 5,
            instruction: 'Koka riset.',
          },
          {
            stepNumber: 6,
            instruction: 'Finhacka rödlöken och tärna tomaterna.',
          },
          {
            stepNumber: 7,
            instruction: 'Blanda lök, tomater, olja och sambal oelek. Smaka av salsan med svartpeppar.',
          },
          {
            stepNumber: 8,
            instruction: 'Servera limebakad lax med ris, salsa och limeklyftor.',
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
