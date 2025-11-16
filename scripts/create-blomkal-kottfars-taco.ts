import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Köttfärs 5%': { calories: 131, protein: 20, carbs: 0, fat: 5 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Purjulök': { calories: 61, protein: 1.5, carbs: 14, fat: 0.3 },
  'Blomkål': { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  'Körsbärtomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Tacokrydda': { calories: 300, protein: 10, carbs: 60, fat: 5 },
  'Peppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
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
  console.log('🌮 Creating Blomkål och köttfärs med smak av taco recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kottfars = await findOrCreateFoodItem('Köttfärs 5%')
  const ris = await findOrCreateFoodItem('Ris')
  const purjulok = await findOrCreateFoodItem('Purjulök')
  const blomkal = await findOrCreateFoodItem('Blomkål')
  const korsbarstomater = await findOrCreateFoodItem('Körsbärtomater')
  const tacokrydda = await findOrCreateFoodItem('Tacokrydda')
  const peppar = await findOrCreateFoodItem('Peppar')
  const salt = await findOrCreateFoodItem('Salt')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Blomkål och köttfärs med smak av taco',
      description: 'Blomkål och köttfärs i ugn som du kryddar med tacokryddor!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/ZKMXpTq0/2025-11-15-13-12-28-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kottfars.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: purjulok.id,
            amount: 33,
            displayAmount: '33',
            displayUnit: 'g',
          },
          {
            foodItemId: blomkal.id,
            amount: 167,
            displayAmount: '167',
            displayUnit: 'g',
          },
          {
            foodItemId: korsbarstomater.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
          },
          {
            foodItemId: tacokrydda.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: peppar.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
          {
            foodItemId: salt.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börje med att hacka blomkåln i mindre bitar. Steblomkålen tillsammans med tacokryddor (paprikapulver, chilipulver, spiskummin, lökpulver, vitlökspulver, salt). Lägg det sen på en plåt med bakplåtspapper',
          },
          {
            stepNumber: 2,
            instruction: 'Stek köttfärsen och krydda med salt och peppar, eventuellt tacokryddor. Lägg det sen på plåten på blomkålen.',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka purjulök och tomat och lägg på plåten tillsammans med blomkålen och köttfärsen.',
          },
          {
            stepNumber: 4,
            instruction: 'Sätt i i ugnen på 200 grader i cirka 15 minuter. När det är fem minuter kvar kan du lägga på keso så att det smalter i ugnen.',
          },
          {
            stepNumber: 5,
            instruction: 'Ät och njut!',
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
