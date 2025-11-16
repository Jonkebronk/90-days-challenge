import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Gris fläskfilé rå': { calories: 143, protein: 21, carbs: 0, fat: 6 },
  'Salt m. jod': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Rapsolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Rosmarin, torkad': { calories: 131, protein: 3.3, carbs: 20, fat: 5.9 },
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
  console.log('🥩 Creating Fläskfilé helstekt recipe...\n')

  // Find Tips på tillagning category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'tips-pa-tillagning' }
  })

  if (!category) {
    throw new Error('Tips på tillagning category not found')
  }

  // Create or find all food items
  const flaskfile = await findOrCreateFoodItem('Gris fläskfilé rå')
  const salt = await findOrCreateFoodItem('Salt m. jod')
  const peppar = await findOrCreateFoodItem('Svartpeppar')
  const rapsolja = await findOrCreateFoodItem('Rapsolja')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const rosmarin = await findOrCreateFoodItem('Rosmarin, torkad')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fläskfilé helstekt',
      description: 'Perfekt helstekt fläskfilé med vitlök och rosmarin. En klassisk och imponerande rätt!',
      categoryId: category.id,
      servings: 4,
      coverImage: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800',
      caloriesPerServing: 250,
      proteinPerServing: 32,
      carbsPerServing: 1,
      fatPerServing: 13,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: flaskfile.id,
            amount: 600,
            displayAmount: '600',
            displayUnit: 'g',
          },
          {
            foodItemId: salt.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: peppar.id,
            amount: 2.5,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: rapsolja.id,
            amount: 15,
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: vitlok.id,
            amount: 10,
            displayAmount: '1',
            displayUnit: 'kryta',
          },
          {
            foodItemId: rosmarin.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Låt heist kottet ligga i rumstemperatur minst en timme innan tillagningen. Putsa fläskfilén från senan och hinnor.',
          },
          {
            stepNumber: 2,
            instruction: 'Sätt ugnen på 125 grader. Salta och peppra filén runt om.',
          },
          {
            stepNumber: 3,
            instruction: 'Hetta upp en stekpanna på medelvärme och stek filén i oljan så att den får fin färg',
          },
          {
            stepNumber: 4,
            instruction: 'Stäng ner en halverad vitlöksklyfta och rosmarin och låt steka med en stund. Lägg över filén i en ugnsfast form och häll över oljan med kryddorna.',
          },
          {
            stepNumber: 5,
            instruction: 'Ställ in en köttermometer i den tjockaste delen och ställ in i mitten av ugnen tills termometern visar 68-70 grader.',
          },
          {
            stepNumber: 6,
            instruction: 'Ta ut och låt kottet vila minst 10 minuter innan du skär upp i skivor.',
          },
          {
            stepNumber: 7,
            instruction: 'Häll blandningen av köttsaft och kryddolja som blir kvar i formen över köttsskivorna.',
          },
        ],
      },
    },
  })

  console.log(`✅ Recipe created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - ${recipe.servings} portioner`)
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
