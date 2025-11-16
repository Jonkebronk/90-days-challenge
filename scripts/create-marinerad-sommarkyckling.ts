import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Valfri råsallad': { calories: 15, protein: 1, carbs: 3, fat: 0.2 },
  'Slenderchef BBQ-sås': { calories: 50, protein: 0.5, carbs: 12, fat: 0 },
  'Slenderchef sweet chili-sås': { calories: 120, protein: 0, carbs: 30, fat: 0 },
  'Slenderchef spicy garlic-sås': { calories: 80, protein: 0.5, carbs: 19, fat: 0 },
  'Rapsolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Citron & citronsaft': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
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
  console.log('🍗 Creating Marinerad sommarkyckling recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const potatis = await findOrCreateFoodItem('Potatis')
  const sallad = await findOrCreateFoodItem('Valfri råsallad')
  const bbqsas = await findOrCreateFoodItem('Slenderchef BBQ-sås')
  const sweetchili = await findOrCreateFoodItem('Slenderchef sweet chili-sås')
  const garlicsas = await findOrCreateFoodItem('Slenderchef spicy garlic-sås')
  const rapsolja = await findOrCreateFoodItem('Rapsolja')
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const citron = await findOrCreateFoodItem('Citron & citronsaft')
  const gronsaker = await findOrCreateFoodItem('Blandade grönsaker')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Marinerad sommarkyckling',
      description: 'Marinerad kyckling som kan användas till grillkvällar eller steka hemma i pannan.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/PryZCc33/2025-11-15-11-59-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 48,
      carbsPerServing: 52,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
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
            foodItemId: sallad.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
          {
            foodItemId: bbqsas.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: sweetchili.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: garlicsas.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: rapsolja.id,
            amount: 7.5, // 0.5 msk ≈ 7.5ml
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
          {
            foodItemId: kokosolja.id,
            amount: 5, // 1 tsk ≈ 5ml
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: citron.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
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
            instruction: 'Skiva potatis och lägg i vatten 20-30min',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ihop kryddor och såser till marinad, lägg sedan i kycklingen. Ställ i kylen 20-30 min.',
          },
          {
            stepNumber: 3,
            instruction: 'Stek kycklingen i kokosoljan.',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg upp valfri sallad tillsammans med tärnad citron, persilja och citronsaft.',
          },
          {
            stepNumber: 5,
            instruction: 'Häll av vattnet från potatisen och torka den med en kökshandduk (gnugga). Lägg sedan potatisen i Airfryern tillsammans med rapsoljan. 5 minuter på 180 grader x 2 (skaka mellan). 5 minuter på 200 grader x 2 (skaka mellan).',
          },
          {
            stepNumber: 6,
            instruction: 'Ät!',
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
