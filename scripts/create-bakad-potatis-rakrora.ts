import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Räkor': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  'Keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
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
  console.log('🦐 Creating Bakad potatis med räkröra recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Räkor')
  const keso = await findOrCreateFoodItem('Keso')
  const potatis = await findOrCreateFoodItem('Potatis')
  const rodlok = await findOrCreateFoodItem('Rödlök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Bakad potatis med räkröra',
      description: 'Snabbt, enkelt och lyxigt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/pXkhW6k0/2025-11-15-12-18-10-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 53,
      carbsPerServing: 59,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: rakor.id,
            amount: 207,
            displayAmount: '207',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 21,
            displayAmount: '21',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
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
            instruction: 'Sätt ugnen på ca 175-200 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Tvätta potatisen, torka torr och stick hål i skalet. Det går lika bra med vanlig mjölig potatis som bakpotatis. Lägg potatisen på en plåt och stoppa i ugnen ca 15-20 min (om vanlig potatis) eller tills färdig. Tid beror på storlek på potatis.',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka löken fint. Blanda räkor, keso och lök. Smaka av med kryddorna.',
          },
          {
            stepNumber: 4,
            instruction: 'När potatisen är klar, skär ett kryss och tryck till så den öppnas lite. Servera potatisen fylld med röran tillsammans med en sallad.',
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
