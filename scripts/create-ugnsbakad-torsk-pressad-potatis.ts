import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Tinad torsk': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Purjolök': { calories: 61, protein: 1.5, carbs: 14, fat: 0.3 },
  'Körsbärstomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  'Vitlöksklyfta': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🐟 Creating Ugnsbakad torsk med pressad potatis recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torsk = await findOrCreateFoodItem('Tinad torsk')
  const potatis = await findOrCreateFoodItem('Potatis')
  const purjolok = await findOrCreateFoodItem('Purjolök')
  const tomater = await findOrCreateFoodItem('Körsbärstomater')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')
  const vitlok = await findOrCreateFoodItem('Vitlöksklyfta')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ugnsbakad torsk med pressad potatis',
      description: 'Ugnsbakad torsk med pressad potatis',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/jqGTXxgw/2025-11-14-14-36-04-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
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
            foodItemId: purjolok.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: gronsaker.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
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
            instruction: 'Sätt ugnen på 200 grader.',
          },
          {
            stepNumber: 2,
            instruction: 'Strimla purjolök och vitlök samt halvera körsbärstomaterna.',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg torsken på ett folieark och fördela grönsakerna runt om fisken.',
          },
          {
            stepNumber: 4,
            instruction: 'Krydda med svartpeppar eller annan önskad krydda samt pressa över lite citron om dieten tillåter.',
          },
          {
            stepNumber: 5,
            instruction: 'Vik ihop till ett foliepaket. Tillaga foliepaket i ugnen i ca 15 minuter eller tills fisken är färdig',
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
