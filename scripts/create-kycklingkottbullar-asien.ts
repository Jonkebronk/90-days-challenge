import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 172, protein: 17.5, carbs: 0, fat: 11 },
  'Risnudlar': { calories: 364, protein: 3.4, carbs: 84, fat: 0.6 },
  'Valfria grönsaker': { calories: 25, protein: 1.5, carbs: 5, fat: 0.2 },
  'Ägg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Färsk chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Färsk koriander': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5 },
  'Citrongräs': { calories: 99, protein: 1.8, carbs: 25, fat: 0.5 },
  'Lime': { calories: 30, protein: 0.7, carbs: 11, fat: 0.2 },
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
  console.log('🍜 Creating Kycklingköttbullar med smak av Asien recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const risnudlar = await findOrCreateFoodItem('Risnudlar')
  const gronsaker = await findOrCreateFoodItem('Valfria grönsaker')
  const agg = await findOrCreateFoodItem('Ägg')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const chili = await findOrCreateFoodItem('Färsk chili')
  const koriander = await findOrCreateFoodItem('Färsk koriander')
  const citrongras = await findOrCreateFoodItem('Citrongräs')
  const lime = await findOrCreateFoodItem('Lime')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kycklingköttbullar med smak av Asien',
      description: 'Kycklingköttbullar med smaker inspirerade från Asien.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/KcWhJGzh/2025-11-14-14-18-40-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
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
            foodItemId: gronsaker.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: agg.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål'
          },
          {
            foodItemId: lime.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
            notes: 'Klyfta'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Finhacka koriander, chili och vitlök. Vispa upp ägget lätt',
          },
          {
            stepNumber: 2,
            instruction: 'Tillaga risnudlarna enligt anvisningen på paketet',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda kryddorna och det uppvispade ägget tillsammans med kycklingfärsen och rulla till bollar',
          },
          {
            stepNumber: 4,
            instruction: 'Stek kycklingbullarna i lite kokosolja på medelvärme tills de får fin färg och blir helt genomstekta',
          },
          {
            stepNumber: 5,
            instruction: 'Servera tillsammans med risnudlarna och en valfri grönsallad',
          },
          {
            stepNumber: 6,
            instruction: 'Pressa gärna lite limesaft över och ringla på lite Slender Chef sweet chili sås',
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
