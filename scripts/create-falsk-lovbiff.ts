import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs': { calories: 250, protein: 17, carbs: 0, fat: 20 },
  'Cayennepeppar': { calories: 318, protein: 12, carbs: 56, fat: 17 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Paprikapulver': { calories: 282, protein: 14, carbs: 54, fat: 13 },
  'Örtsalt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Blandade grönsaker': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  'Ägg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'Lökpulver': { calories: 341, protein: 8.4, carbs: 79, fat: 0.5 },
  'Vitlökspulver': { calories: 331, protein: 17, carbs: 72, fat: 0.7 },
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
  console.log('🥩 Creating Falsk lövbiff recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs')
  const cayenne = await findOrCreateFoodItem('Cayennepeppar')
  const potatis = await findOrCreateFoodItem('Potatis')
  const paprika = await findOrCreateFoodItem('Paprikapulver')
  const ortsalt = await findOrCreateFoodItem('Örtsalt')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')
  const agg = await findOrCreateFoodItem('Ägg')
  const lokpulver = await findOrCreateFoodItem('Lökpulver')
  const vitlokspulver = await findOrCreateFoodItem('Vitlökspulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Falsk lövbiff',
      description: 'En höjdarrätt som väl kan förberedas (eller att ha i frysen) och bara ta fram och steka till.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/5thf948S/2025-11-15-11-52-31-NVIDIA-Ge-Force-Overlay-DT.png',
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
            foodItemId: cayenne.id,
            amount: 0.5, // 1 krm ≈ 0.5g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: ortsalt.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 65,
            displayAmount: '65',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål'
          },
          {
            foodItemId: lokpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vitlokspulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda alla ingredienser i en bunke.',
          },
          {
            stepNumber: 2,
            instruction: 'Lägg ut en stor rektangel med gladpack, ta hälften av köttfärsmeten och klicka ut den. Lägg på en lika stor rektangel av gladpack uppepå',
          },
          {
            stepNumber: 3,
            instruction: 'Kavla ut köttfärsen till en stor platta.',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg båda plattorna uppepå varandra på en stor bricka och in i frysen i minst 3 timmar',
          },
          {
            stepNumber: 5,
            instruction: 'Ta ut ur frysen och skär direkt upp i stora bitar.',
          },
          {
            stepNumber: 6,
            instruction: 'Stek i kokos- eller rapsolja',
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
