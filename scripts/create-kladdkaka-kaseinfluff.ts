import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Whey protein choklad': { calories: 380, protein: 80, carbs: 8, fat: 5 },
  'Kasein': { calories: 360, protein: 80, carbs: 5, fat: 1 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍰 Creating Kladdkaka med kaseinfluff recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const agg = await findOrCreateFoodItem('Ägg')
  const whey = await findOrCreateFoodItem('Whey protein choklad')
  const kasein = await findOrCreateFoodItem('Kasein')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kladdkaka med kaseinfluff',
      description: 'Kladdkaka med kaseinfluff som passar bra som frukost',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/y8sNV05H/2025-11-14-09-54-11-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 447,
      proteinPerServing: 40,
      carbsPerServing: 32,
      fatPerServing: 17,

      ingredients: {
        create: [
          {
            foodItemId: kokosolja.id,
            amount: 15, // 3 tsk ≈ 15g
            displayAmount: '3',
            displayUnit: 'tsk',
          },
          {
            foodItemId: agg.id,
            amount: 109,
            displayAmount: '109',
            displayUnit: 'g',
          },
          {
            foodItemId: whey.id,
            amount: 16,
            displayAmount: '16',
            displayUnit: 'g',
          },
          {
            foodItemId: kasein.id,
            amount: 13,
            displayAmount: '13',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: bakpulver.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: vatten.id,
            amount: 30, // 2 msk ≈ 30ml
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
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
            instruction: 'Blanda kasein och 0.5 dl vatten till en mousseliknande konsistens och ställ in i kylen',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda de övriga torra ingredienserna i en skål',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt smält kokosolja och ägg och rör till en jämn smet',
          },
          {
            stepNumber: 5,
            instruction: 'Tillsätt vatten om konsistensen blir för tjock',
          },
          {
            stepNumber: 6,
            instruction: 'Häll smeten i en ugnsäker form och ställ i ugnen i ca 5-10 min beroende på hur kladdigt den ska vara',
          },
          {
            stepNumber: 7,
            instruction: 'Klart! Toppa med nötter/bär och servera med kaseinet',
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
