import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 172, protein: 20.5, carbs: 0, fat: 9.5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 7, fat: 0.2 },
  'Gullök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
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
  console.log('🥧 Creating Shepard\'s pie recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const potatis = await findOrCreateFoodItem('Potatis')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const gullok = await findOrCreateFoodItem('Gullök')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Shepard\'s pie',
      description: 'Enkel gratäng som ger många portioner! Jag gjorde 6st. Funkar självklart med både kyckling och nöt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/vT6YGRVF/2025-11-15-10-38-49-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 54,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 133,
            displayAmount: '133',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Stek lök och ev färsk vitlök i kokosolja',
          },
          {
            stepNumber: 2,
            instruction: 'Ner med vald mängd kycklingfärs/nötfärs. Krydda upp färsen och tillsätt krossade tomater och tomatpuré. Tillsätt vatten vid behov',
          },
          {
            stepNumber: 3,
            instruction: 'Under tiden du gör såsen koka potatis i ca 20min. Kontrollera att potatisen är färdigkokt',
          },
          {
            stepNumber: 4,
            instruction: 'Häll bort vatten och mosa potatisarna. Krydda upp potatismoset med valfria kryddor och tillsätt ev vatska för att få ett lenare mos',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg såsen i en ugnsfast form. Bred ut moset ovanpå och gradda i ugnen på 200-250 grader beroende på ugn i ca 20min. Moset ska få en yta bara',
          },
          {
            stepNumber: 6,
            instruction: 'Ät :)',
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
