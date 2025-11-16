import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Fettsnål nötfärs': { calories: 151, protein: 20, carbs: 0, fat: 7.5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Slender chef BBQsås': { calories: 50, protein: 0.5, carbs: 12, fat: 0 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
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
  console.log('🍔 Creating Saftiga BBQ-burgare recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Fettsnål nötfärs')
  const potatis = await findOrCreateFoodItem('Potatis')
  const bbqsas = await findOrCreateFoodItem('Slender chef BBQsås')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saftiga BBQ-burgare',
      description: 'Saftiga BBQ-burgare med kryddade potatisklyftor.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/6pRXjskD/2025-11-15-12-01-48-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 440,
      proteinPerServing: 39,
      carbsPerServing: 52,
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
            foodItemId: bbqsas.id,
            amount: 30, // 2 msk ≈ 30ml
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
            notes: 'Att äta utöver receptet (för en komplett lunch)'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda köttfärsen tillsammans med kryddorna och slender chefs BBQsås',
          },
          {
            stepNumber: 2,
            instruction: 'Knåda färsen till att blandats ordentligt och forma till en burgare',
          },
          {
            stepNumber: 3,
            instruction: 'Stek burgaren på hög värme tills den fått stek på båda sidor',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg burgaren i ugnsäker form och kör i ugnen på 225grader i ca10min',
          },
          {
            stepNumber: 5,
            instruction: 'Klyfta upp potatisen, skrubba in den med lite kokosolja och sätt in i ugnen i ca20min',
          },
          {
            stepNumber: 6,
            instruction: 'När potatisen är färdig kryddas den med vitlökspulver och cayennepeppar. Servera tillsammans med en fräsch sallad.',
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
