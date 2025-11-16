import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Minikeso': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Saffran': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Amandas goda saffransplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const minikeso = await findOrCreateFoodItem('Minikeso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const saffran = await findOrCreateFoodItem('Saffran')
  const kanel = await findOrCreateFoodItem('Kanel')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Amandas goda saffransplättar',
      description: 'Kesoplättar med smak av saffran och kanel',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/HsNkMj6x/2025-11-14-11-31-55-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 40,
      carbsPerServing: 35,
      fatPerServing: 18,
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
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
          {
            foodItemId: kanel.id,
            amount: 0.5,
            displayAmount: '0.5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mal ner havregrynen till mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda ner minikeso, ägget och kryddorna',
          },
          {
            stepNumber: 3,
            instruction: 'Mixa dessa till en slät smet',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt sedan vattnet',
          },
          {
            stepNumber: 5,
            instruction: 'Smält väldigt lite kokosfett eller rapsolja i en stekpanna',
          },
          {
            stepNumber: 6,
            instruction: 'Häll sedan i smeten i lika stora plättar och stek, vänd när det börjar bubbla i plåtten',
          },
          {
            stepNumber: 7,
            instruction: 'Servera med vaniljkvarg och varma bär och njut!',
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
