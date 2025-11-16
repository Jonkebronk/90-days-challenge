import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kalkonbacon': { calories: 149, protein: 21.5, carbs: 1, fat: 6 },
  'Torsk': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Kesella lätt': { calories: 44, protein: 7.5, carbs: 2.5, fat: 0.2 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Blomkål': { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  'Riven pepparrot': { calories: 48, protein: 1.2, carbs: 11, fat: 0.7 },
  'Persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
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
  console.log('🐟 Creating Baconlindad torskrygg med pepparrot recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const torsk = await findOrCreateFoodItem('Torsk')
  const kesella = await findOrCreateFoodItem('Kesella lätt')
  const potatis = await findOrCreateFoodItem('Potatis')
  const blomkal = await findOrCreateFoodItem('Blomkål')
  const pepparrot = await findOrCreateFoodItem('Riven pepparrot')
  const persilja = await findOrCreateFoodItem('Persilja')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Baconlindad torskrygg med pepparrot',
      description: 'En god och lite lyxigare middag! Enkel att tillaga och den kommer imponera på de flesta!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/GmyLkBJW/2025-11-14-14-17-24-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 53,
      carbsPerServing: 60,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kalkonbacon.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: torsk.id,
            amount: 127,
            displayAmount: '127',
            displayUnit: 'g',
            notes: 'gärna torskrygg'
          },
          {
            foodItemId: kesella.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: blomkal.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: pepparrot.id,
            amount: 8,
            displayAmount: '8',
            displayUnit: 'g',
          },
          {
            foodItemId: persilja.id,
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
            instruction: 'Sätt ugnen på 175 grader. Skala och koka potatisen',
          },
          {
            stepNumber: 2,
            instruction: 'Linda in torsken i två baconskivor och lägg dem i en ugnsfast form.',
          },
          {
            stepNumber: 3,
            instruction: 'Torsken är klar i ugnen efter ca 20 min eller när den är över 52 grader i mitten.',
          },
          {
            stepNumber: 4,
            instruction: 'Koka blomkålen enligt anvisningar på förpackningen (eller tills de är mjuka).',
          },
          {
            stepNumber: 5,
            instruction: 'Mixa blomkålen med lite vatten, kesella, pepparrot, persilja och kryddor efter smak.',
          },
          {
            stepNumber: 6,
            instruction: 'När den har en purèliknande konsistens är det klart att äta!',
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
