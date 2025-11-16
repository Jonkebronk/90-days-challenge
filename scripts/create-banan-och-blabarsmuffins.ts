import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Frysta Blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg naturell': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Whey protein banan milkchake pulver': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Hett uppkokt vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🧁 Creating Banan och blåbärsmuffins recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const frystablabar = await findOrCreateFoodItem('Frysta Blåbär')
  const kvargnaturell = await findOrCreateFoodItem('Kvarg naturell')
  const wheyprotein = await findOrCreateFoodItem('Whey protein banan milkchake pulver')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const vatten = await findOrCreateFoodItem('Hett uppkokt vatten')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Banan och blåbärsmuffins',
      description: 'Supergoda snabba muffins.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/FKj8hnYq/2025-11-14-11-26-20-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 489,
      proteinPerServing: 41,
      carbsPerServing: 44,
      fatPerServing: 16,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: frystablabar.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: kvargnaturell.id,
            amount: 74,
            displayAmount: '74',
            displayUnit: 'g',
          },
          {
            foodItemId: wheyprotein.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 49,
            displayAmount: '49',
            displayUnit: 'g',
          },
          {
            foodItemId: sotstro.id,
            amount: 50, // 0.5 dl ≈ 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl ≈ 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: bakpulver.id,
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
            instruction: 'Vispa ägg och sötströ poröst',
          },
          {
            stepNumber: 2,
            instruction: 'Vispa ner whey protein, mjöl, kvarg och bakpulver.',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt det uppkokta vattnet och rör till jamn smet.',
          },
          {
            stepNumber: 4,
            instruction: 'Fordela i 6st muffinsformar på en cupcakeplåt.',
          },
          {
            stepNumber: 5,
            instruction: 'Toppa med 1tsk frysta blåbär i varje form. Grädda i 200grader mitt i ugnen ca 15min.',
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
