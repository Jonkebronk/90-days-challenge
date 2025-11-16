import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gul lök, riven': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Vitkål': { calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
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
  console.log('🍖 Creating Köttbullar med potatismos recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gullok = await findOrCreateFoodItem('Gul lök, riven')
  const vitkal = await findOrCreateFoodItem('Vitkål')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttbullar med potatismos',
      description: 'God husmanskost med få ingredienser, perfekt att göra flera portioner och ha som matlåda.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/NGd2YnNq/2025-11-15-12-28-41-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 46,
      carbsPerServing: 58,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 152,
            displayAmount: '152',
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
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vitkal.id,
            amount: 160,
            displayAmount: '160',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala och skär potatisen i mindre bitar. Koka den tills den är mjuk nog att göra mos på.',
          },
          {
            stepNumber: 2,
            instruction: 'Under tiden, riv gul lök och blanda med nötfärsen. Ha i svartpeppar och örtsalt och rulla till bollar. Stek på medelvärme tills genomstekta.',
          },
          {
            stepNumber: 3,
            instruction: 'När potatisen kokat klart, häll en del av vattnet potatisen kokat i, i en skål. Gör mos av potatisen, gärna med hjälp av en elvisp. Tillsätt stärkelsevattnet för att få rätt konsistens. Krydda med vitpeppar, muskotnöt och örtsalt.',
          },
          {
            stepNumber: 4,
            instruction: 'Strimla din mängd vitkål. Klart att servera!',
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
