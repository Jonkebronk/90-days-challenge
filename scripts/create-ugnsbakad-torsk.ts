import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torsk': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Citron': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Oregano': { calories: 265, protein: 9, carbs: 69, fat: 4.3 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🐟 Creating Ugnsbakad torsk recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torsk = await findOrCreateFoodItem('Torsk')
  const potatis = await findOrCreateFoodItem('Potatis')
  const citron = await findOrCreateFoodItem('Citron')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const oregano = await findOrCreateFoodItem('Oregano')
  const salt = await findOrCreateFoodItem('Salt')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ugnsbakad torsk',
      description: 'Torsk smaksatt med vitlök, oregano och citron!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/JnjRdsGf/2025-11-15-13-11-14-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 48,
      carbsPerServing: 52,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torsk.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: citron.id,
            amount: 90,
            displayAmount: '3',
            displayUnit: 'st',
            notes: 'beror på mängden fisk',
          },
          {
            foodItemId: vitlok.id,
            amount: 6,
            displayAmount: '2-3',
            displayUnit: 'klyftor',
          },
          {
            foodItemId: oregano.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'krm',
          },
          {
            foodItemId: salt.id,
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
            instruction: 'Skär fisken i bitar o väg bitarna/portion som du önskar',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg fisken i en skål',
          },
          {
            stepNumber: 3,
            instruction: 'Pressa 3 citroner (beror på mängden fisk, den ska täcka fisken helt.',
          },
          {
            stepNumber: 4,
            instruction: 'Häll över citronsaften i skålen med fisken',
          },
          {
            stepNumber: 5,
            instruction: 'Pressa 2-3 vitlöksklyftor o blanda i med citronsaften',
          },
          {
            stepNumber: 6,
            instruction: 'Lägg salt och oregano o blanda väl. Låt stå i kylskåpet 20 min',
          },
          {
            stepNumber: 7,
            instruction: 'Lägg sedan upp fisken i en glasform O in i ugnen',
          },
          {
            stepNumber: 8,
            instruction: 'Tillagningstid 20 min eller 56 grader innertemperatur',
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
