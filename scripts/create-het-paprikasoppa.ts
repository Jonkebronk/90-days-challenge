import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Röd paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Passerade tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Röd chilifrukt': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Vitlöksklyftor': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Buljongtärning': { calories: 20, protein: 1, carbs: 3, fat: 0.5 },
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
  console.log('🌶️ Creating Het paprikasoppa recipe...\n')

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
  const paprika = await findOrCreateFoodItem('Röd paprika')
  const tomater = await findOrCreateFoodItem('Passerade tomater')
  const vatten = await findOrCreateFoodItem('Vatten')
  const chili = await findOrCreateFoodItem('Röd chilifrukt')
  const vitlok = await findOrCreateFoodItem('Vitlöksklyftor')
  const buljong = await findOrCreateFoodItem('Buljongtärning')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Het paprikasoppa',
      description: 'Het paprikasoppa',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/28pbgf9r/2025-11-14-14-25-50-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
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
            foodItemId: paprika.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 100,
            displayAmount: '100',
            displayUnit: 'g',
            notes: 'Passerade eller krossade tomater'
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl
            displayAmount: '1',
            displayUnit: 'dl',
            notes: 'efter tycke och smak'
          },
          {
            foodItemId: chili.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: buljong.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Dela och kärna ur paprikorna. Lägg med skalet uppåt på en ugnsplåt och grilla i ugnen på ca 250 grader tills skalet blivit svart och bubbligt.',
          },
          {
            stepNumber: 2,
            instruction: 'Låt paprikorna svalna i en tätförsluten bunke eller plastpåse. Dra sedan av skalet.',
          },
          {
            stepNumber: 3,
            instruction: 'Mixa paprikorna (utan skal) med tomater, en finhackad chilifrukt samt två pressade vitlöksklyftor. Späd med vatten tills du får önskad konsistens och tillsätt en buljongtärning om du vill.',
          },
          {
            stepNumber: 4,
            instruction: 'Koka upp soppan. Låt puttra en liten stund.',
          },
          {
            stepNumber: 5,
            instruction: 'Stek kycklingen, blanda i stekt kyckling i bitar samt kokt potatis i bitar och låt värmas med soppan.',
          },
          {
            stepNumber: 6,
            instruction: 'Krydda efter smak.',
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
