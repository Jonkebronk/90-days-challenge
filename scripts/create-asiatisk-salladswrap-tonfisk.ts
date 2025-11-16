import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Färsk tonfisk': { calories: 144, protein: 23, carbs: 0, fat: 5 },
  'Risnudlar': { calories: 109, protein: 0.9, carbs: 25, fat: 0.1 },
  'Kinakål': { calories: 13, protein: 1, carbs: 2.2, fat: 0.2 },
  'Morot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Gurka': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  'Lime': { calories: 30, protein: 0.7, carbs: 11, fat: 0.2 },
  'Jordnötter utan salt': { calories: 567, protein: 26, carbs: 16, fat: 49 },
  'Chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Sesamfrön': { calories: 573, protein: 18, carbs: 23, fat: 50 },
  'Koriander': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5 },
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
  console.log('🌯 Creating Asiatisk salladswrap med halstrad tonfisk recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const tonfisk = await findOrCreateFoodItem('Färsk tonfisk')
  const risnudlar = await findOrCreateFoodItem('Risnudlar')
  const kinakal = await findOrCreateFoodItem('Kinakål')
  const morot = await findOrCreateFoodItem('Morot')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const gurka = await findOrCreateFoodItem('Gurka')
  const lime = await findOrCreateFoodItem('Lime')
  const jordnotter = await findOrCreateFoodItem('Jordnötter utan salt')
  const chili = await findOrCreateFoodItem('Chili')
  const sesamfron = await findOrCreateFoodItem('Sesamfrön')
  const koriander = await findOrCreateFoodItem('Koriander')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Asiatisk salladswrap med halstrad tonfisk',
      description: 'En salladswrap med en asiatisktouch serverad med färsk tonfisk. En fräsch, lyxig och somrigrått!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PqW8kRwW/2025-11-15-12-06-19-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: tonfisk.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: risnudlar.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: kinakal.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: morot.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 120,
            displayAmount: '120',
            displayUnit: 'g',
          },
          {
            foodItemId: gurka.id,
            amount: 400,
            displayAmount: '400',
            displayUnit: 'g',
          },
          {
            foodItemId: lime.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: jordnotter.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål'
          },
          {
            foodItemId: chili.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: sesamfron.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: koriander.id,
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
            instruction: 'Sätt ugnen på 200 grader och rosta jordnötterna tills de fått färg',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa 1/2 kruka koriander, skialet och saften ifrån 1 lime, 1/2 chili, 1 matsked sesamfrön, vatten och salta efter smak.',
          },
          {
            stepNumber: 3,
            instruction: 'Skala och riv moroten',
          },
          {
            stepNumber: 4,
            instruction: 'Tillaga risnudlar enligt förpackning',
          },
          {
            stepNumber: 5,
            instruction: 'Hacka upp rödlök och gurka',
          },
          {
            stepNumber: 6,
            instruction: 'Skala av och skölj blad ifrån kinakålen',
          },
          {
            stepNumber: 7,
            instruction: 'Stek hastigt tonfisken på hög värme i en panna med en klick kokosolja',
          },
          {
            stepNumber: 8,
            instruction: 'Ta två blad ifrån kinakålen och fördela grönsaker, risnudlar och tonfisken. Toppa med chili, rostade jordnötter, dressing och koriander',
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
