import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Fläskfilé': { calories: 143, protein: 21, carbs: 0, fat: 6 },
  'Kvarg naturell': { calories: 60, protein: 11, carbs: 4, fat: 0.2 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Butternutpumpa': { calories: 45, protein: 1, carbs: 12, fat: 0.1 },
  'Passerade tomater': { calories: 38, protein: 1.5, carbs: 7.3, fat: 0.3 },
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
  console.log('🥔 Creating Fläskfilé med potatis & pumpa recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const flaskfile = await findOrCreateFoodItem('Fläskfilé')
  const kvarg = await findOrCreateFoodItem('Kvarg naturell')
  const potatis = await findOrCreateFoodItem('Potatis')
  const pumpa = await findOrCreateFoodItem('Butternutpumpa')
  const tomater = await findOrCreateFoodItem('Passerade tomater')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fläskfilé med potatis & pumpa',
      description: 'Matig och lättlagad rätt som passar hela familjen.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/yxsGPdMT/2025-11-15-12-35-23-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 46,
      carbsPerServing: 59,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: flaskfile.id,
            amount: 144,
            displayAmount: '144',
            displayUnit: 'g',
            notes: 'alt kyckling/nötkött',
          },
          {
            foodItemId: kvarg.id,
            amount: 14,
            displayAmount: '14',
            displayUnit: 'g',
            notes: 'kan uteslutas',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: pumpa.id,
            amount: 167,
            displayAmount: '167',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 33,
            displayAmount: '33',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Finputsa fläskfilén från fett och skär i smala skivor',
          },
          {
            stepNumber: 2,
            instruction: 'Skala potatis och skär i klyftor',
          },
          {
            stepNumber: 3,
            instruction: 'Skala butternutpumpa och skär i 2x2 cm bitar',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg pumpan och potatisen på en plåt in i ugnen till de blir mjuka',
          },
          {
            stepNumber: 5,
            instruction: 'Värm passerade tomater i en kastrull på spisen. Låt koka upp och rör ner kryddorna. Smaka av.',
          },
          {
            stepNumber: 6,
            instruction: 'Stek fläskfilén. Krydda vid behov.',
          },
          {
            stepNumber: 7,
            instruction: 'När potatis, pumpa och fläskfilén är klara, ta av tomatåsen från spisen och rör ner en klick kvarg',
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
