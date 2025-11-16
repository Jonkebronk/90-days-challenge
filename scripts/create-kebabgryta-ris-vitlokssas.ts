import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Fläskfilé': { calories: 143, protein: 21, carbs: 0, fat: 6 },
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Larsa grekisk yoghurt': { calories: 57, protein: 10, carbs: 4, fat: 0.2 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 7, fat: 0.2 },
  'Tomatpuré': { calories: 82, protein: 4.3, carbs: 18, fat: 0.5 },
  'Champinjoner': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Slender chef sweet chili': { calories: 120, protein: 0, carbs: 30, fat: 0 },
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
  console.log('🥙 Creating "Kebab"gryta med ris och vitlökssås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const flaskfile = await findOrCreateFoodItem('Fläskfilé')
  const kycklingfile = await findOrCreateFoodItem('Kycklingfilé')
  const yoghurt = await findOrCreateFoodItem('Larsa grekisk yoghurt')
  const ris = await findOrCreateFoodItem('Ris')
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const champinjoner = await findOrCreateFoodItem('Champinjoner')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const sweetchili = await findOrCreateFoodItem('Slender chef sweet chili')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: '"Kebab"gryta med ris och vitlökssås',
      description: 'Kebabkryddad fläsk',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/GmM2RnMS/2025-11-15-11-51-34-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 52,
      carbsPerServing: 62,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: flaskfile.id,
            amount: 53,
            displayAmount: '53',
            displayUnit: 'g',
          },
          {
            foodItemId: kycklingfile.id,
            amount: 80,
            displayAmount: '80',
            displayUnit: 'g',
          },
          {
            foodItemId: yoghurt.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: tomatpure.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: champinjoner.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
            notes: 'eller färsk paprika'
          },
          {
            foodItemId: rodlok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: sweetchili.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
            notes: 'Slender chef sweet chili'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Putsa fläskfilén noga och strimla den tillsammans med kycklingfilén och rödlöken.',
          },
          {
            stepNumber: 2,
            instruction: 'Stek kött, kyckling och lök i lite olja. krydda med kebabkrydda. Tillsätt tomatpurén. Koka vatten till riset.',
          },
          {
            stepNumber: 3,
            instruction: 'När köttet fått färg, tillsätt krossade tomater, vitlök och champinjoner/paprika.',
          },
          {
            stepNumber: 4,
            instruction: 'Koka ihop grytan. Smaka av med svartpeppar, chilipulver och örtsalt.',
          },
          {
            stepNumber: 5,
            instruction: 'Vitlöksdressing: Larsas yoghurt, vitlök, slender chefs sweet chili (kan uteslutas), svartpeppar, lite örtsalt',
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
