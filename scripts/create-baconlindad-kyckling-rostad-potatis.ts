import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Kalkonbacon': { calories: 149, protein: 21.5, carbs: 1, fat: 6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Chiliflakes': { calories: 282, protein: 13, carbs: 50, fat: 14 },
  'Timjan': { calories: 276, protein: 9.1, carbs: 64, fat: 7.4 },
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
  console.log('🥓 Creating Baconlindad kyckling med rostad potatis recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kycklingfilé')
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const chiliflakes = await findOrCreateFoodItem('Chiliflakes')
  const timjan = await findOrCreateFoodItem('Timjan')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Baconlindad kyckling med rostad potatis',
      description: 'Smarrig potatis med lite sting i (uteslut chiliflakes eller ta en mindre mängd för mindre sting)',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/vZKcLFVz/2025-11-14-14-32-29-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 509,
      proteinPerServing: 54,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 133,
            displayAmount: '133',
            displayUnit: 'g',
          },
          {
            foodItemId: kalkonbacon.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: chiliflakes.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: timjan.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Dela potatisen i ca 1-2cm stora bitar. Blanda den med 0.5tsk rapsolja och kryddorna. Rosta i ugnen i ca 30 min på 225gender. Skala och dela löken i klyftor och lägg in den ihop med potatisen. Rör om då och då. Dela kycklingen på mitten så den blir smalare. och dela sen i 4 delar. Dela baconskivorna på mitten så de bli 4 skivor. Linda varje kycklingbit i bacon och trä på på blötlagda spett. Grilla på direkt värme. ca 5min på varje sida. eller i stekpanna på hög värme ca 5 min på varje sida. Vänd på de flera gånger så de blir jämt tillagade.',
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
