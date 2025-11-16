import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg (ca 1st medelstort)': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Chiafrö (kan uteslutas)': { calories: 486, protein: 17, carbs: 42, fat: 31 },
  'Kvarg/grekisk yoghurt (valfritt smak/naturellt)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Kvarg/grekisk yoghurt (tillbehör)': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vaniljpulver (kan uteslutas)': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🥞 Creating Tunna pannkakor (glutenfria) recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg (ca 1st medelstort)')
  const bar = await findOrCreateFoodItem('Bär')
  const chiafro = await findOrCreateFoodItem('Chiafrö (kan uteslutas)')
  const kvarg1 = await findOrCreateFoodItem('Kvarg/grekisk yoghurt (valfritt smak/naturellt)')
  const kvarg2 = await findOrCreateFoodItem('Kvarg/grekisk yoghurt (tillbehör)')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver (kan uteslutas)')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Tunna pannkakor (glutenfria)',
      description: 'För den som är sugen på tunna frasiga pannkakor. Ett plus är att man har kvar kvarg till toppingen!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/YSFs2DsJ/2025-11-14-10-59-08-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 478,
      proteinPerServing: 38,
      carbsPerServing: 45,
      fatPerServing: 15,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 123,
            displayAmount: '123',
            displayUnit: 'g (ca 1st medelstort)',
          },
          {
            foodItemId: bar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: chiafro.id,
            amount: 30, // 2 msk ≈ 30g
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: kvarg1.id,
            amount: 49,
            displayAmount: '49',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg2.id,
            amount: 99,
            displayAmount: '99',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 49,
            displayAmount: '49',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: vaniljpulver.id,
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
            instruction: 'Blanda 50g kvarg (eller grekisk yoghurt) med 1 dl vatten tills det blivit en "vättnig" konsistens.',
          },
          {
            stepNumber: 2,
            instruction: 'Knäck i ägget i kvargblandningen och rör runt.',
          },
          {
            stepNumber: 3,
            instruction: 'Häll sakta eller sikta ned rismjöl med vaniljpulver i smeten. Vispa så det inte finns några klumpar.',
          },
          {
            stepNumber: 4,
            instruction: 'Stek tunna pannkakakor i stekpannan på medelhög värme (tips att använda kokosolja vid stekningen).',
          },
          {
            stepNumber: 5,
            instruction: 'Servera med resterande 100 g kvarg/grekisk yoghurt (tips att ha smaksatt här!) och bär tillsammans med chiafrön.',
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
