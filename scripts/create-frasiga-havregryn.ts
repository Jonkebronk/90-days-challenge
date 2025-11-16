import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Frysta bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg/Keso/Pudding': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Keso mini': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Kanel/kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥣 Creating Frasiga havregryn recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const frystaBar = await findOrCreateFoodItem('Frysta bär')
  const kvargKesoPudding = await findOrCreateFoodItem('Kvarg/Keso/Pudding')
  const kesoMini = await findOrCreateFoodItem('Keso mini')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const kanelKardemumma = await findOrCreateFoodItem('Kanel/kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frasiga havregryn',
      description: 'Supergod variant när du tröttnat på den vanliga gröten!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/mDbS9Tw9/2025-11-14-12-07-29-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: frystaBar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: kvargKesoPudding.id,
            amount: 101,
            displayAmount: '101',
            displayUnit: 'g',
          },
          {
            foodItemId: kesoMini.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: kanelKardemumma.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda havregryn med Keso mini',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg ner blandningen i en stekpanna med kokosolja',
          },
          {
            stepNumber: 3,
            instruction: 'Stek tills du ser att keson smält och havregrynen fått färg',
          },
          {
            stepNumber: 4,
            instruction: 'Klar! Servera i skål med resterande ingredienser!',
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
