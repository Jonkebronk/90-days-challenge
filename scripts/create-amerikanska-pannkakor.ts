import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Mini keso': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Durumvetemjöl': { calories: 339, protein: 13, carbs: 71, fat: 1.5 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🥞 Creating Johannas Amerikanska pannkakor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const minikeso = await findOrCreateFoodItem('Mini keso')
  const durumvetemjol = await findOrCreateFoodItem('Durumvetemjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Johannas Amerikanska pannkakor',
      description: 'Härligt fluffiga pannkakor! Smakar som riktiga amerikanska pannkakor enligt barnen i familjen!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/prj11hY7/2025-11-14-10-05-16-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 39,
      carbsPerServing: 34,
      fatPerServing: 19,
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
            foodItemId: minikeso.id,
            amount: 142,
            displayAmount: '142',
            displayUnit: 'g',
          },
          {
            foodItemId: durumvetemjol.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: sotstro.id,
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
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
            instruction: 'Vispa äggvitan till hårt skum',
          },
          {
            stepNumber: 2,
            instruction: 'Mixa keso, äggula och vatten',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda mjöl, bakpulver, vaniljpulver och sötströ',
          },
          {
            stepNumber: 4,
            instruction: 'Häll i keson i mjölblandningen och blanda',
          },
          {
            stepNumber: 5,
            instruction: 'Vänd sedan i den uppvispade äggvitan',
          },
          {
            stepNumber: 6,
            instruction: 'Stek små pannkakor i kokosolja på hög medelvärme. Vänd när ytan börjar se lite torr ut och du ser små bubblor på ytan.',
          },
          {
            stepNumber: 7,
            instruction: 'Ät och njut!',
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
