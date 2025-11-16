import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Naturell Yoghurt': { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  'Bär av valfri sort': { calories: 40, protein: 1, carbs: 9, fat: 0.3 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
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
  console.log('🥧 Creating Baked oats - Muslikaka recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const yoghurt = await findOrCreateFoodItem('Naturell Yoghurt')
  const bar = await findOrCreateFoodItem('Bär av valfri sort')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const vatten = await findOrCreateFoodItem('Vatten')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Baked oats - Muslikaka',
      description: 'Klassisk engelsk frukost. Gröten möter kaka och blir till en härlig mättande kombination.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/hPH5xrg4/2025-11-14-10-03-23-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 359,
      proteinPerServing: 15,
      carbsPerServing: 28,
      fatPerServing: 20,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 61,
            displayAmount: '61',
            displayUnit: 'g',
          },
          {
            foodItemId: kokosolja.id,
            amount: 11,
            displayAmount: '11',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: yoghurt.id,
            amount: 88,
            displayAmount: '88',
            displayUnit: 'g',
          },
          {
            foodItemId: bar.id,
            amount: 100, // 1 dl ≈ 100g
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: bakpulver.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: kanel.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: kardemumma.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 175 grader',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda alla torra ingredienser i en bunke',
          },
          {
            stepNumber: 3,
            instruction: 'Häll ut blandningen i en oljad och ugnssäker form. Ca 10 cm i diameter',
          },
          {
            stepNumber: 4,
            instruction: 'Blanda ihop vättet och ägget och häll över muslilandningen',
          },
          {
            stepNumber: 5,
            instruction: 'Baka i mitten av ugnen i ca 25 minuter. Den ska ha rest sig och fått lite färg',
          },
          {
            stepNumber: 6,
            instruction: 'Höj värmen till 225 grader och grädda av i ca 5 minuter till så den får en fin krispig yta',
          },
          {
            stepNumber: 7,
            instruction: 'Låt den svalna i 5-10 minuter innan servering',
          },
          {
            stepNumber: 8,
            instruction: 'Servera med yoghurt och bär',
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
