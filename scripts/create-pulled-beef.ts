import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötkött (högrev/ytterlår)': { calories: 157, protein: 30, carbs: 0, fat: 3.5 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥩 Creating Pulled Beef med ris recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notkott = await findOrCreateFoodItem('Nötkött (högrev/ytterlår)')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Pulled Beef',
      description: 'Pulled Beef med ris',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/bv86x79p/2025-11-14-13-42-41-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notkott.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
            notes: 'ex högrev, ytterlår'
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl
            displayAmount: '1',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skär nötköttet i bitar',
          },
          {
            stepNumber: 2,
            instruction: 'Bryn på det i lite kokosfett i en gjutjärnsgryta',
          },
          {
            stepNumber: 3,
            instruction: 'Häll på krossade tomater, vatten och kryddor',
          },
          {
            stepNumber: 4,
            instruction: 'Låt koka tills köttet faller isär, cirka två timmar',
          },
          {
            stepNumber: 5,
            instruction: 'Koka riset',
          },
          {
            stepNumber: 6,
            instruction: 'Dela/dra isär allt kött med en gaffel',
          },
          {
            stepNumber: 7,
            instruction: 'Servera med riset och exempelvis en tomatsalsa',
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
