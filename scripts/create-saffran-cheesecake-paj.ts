import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Hallon': { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7 },
  'Vaniljkvarg': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Kesella lätt kvarg (naturell)': { calories: 50, protein: 10, carbs: 3.5, fat: 0.1 },
  'Havregryn eller fiber havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kokt vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
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
  console.log('🥧 Creating Saffran cheesecake paj recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const hallon = await findOrCreateFoodItem('Hallon')
  const vaniljkvarg = await findOrCreateFoodItem('Vaniljkvarg')
  const kesellakvarg = await findOrCreateFoodItem('Kesella lätt kvarg (naturell)')
  const havregryn = await findOrCreateFoodItem('Havregryn eller fiber havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const koktvatten = await findOrCreateFoodItem('Kokt vatten')
  const sotstro = await findOrCreateFoodItem('Sötströ')
  const kanel = await findOrCreateFoodItem('Kanel')
  const saffran = await findOrCreateFoodItem('Saffran')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saffran cheesecake paj',
      description: 'Enkel och god till frukost',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/SQTm8wJY/2025-11-14-10-27-58-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 306,
      proteinPerServing: 24,
      carbsPerServing: 37,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: hallon.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: vaniljkvarg.id,
            amount: 101,
            displayAmount: '101',
            displayUnit: 'g',
          },
          {
            foodItemId: kesellakvarg.id,
            amount: 50,
            displayAmount: '50',
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
            amount: 50, // 0.5 dl = 50ml
            displayAmount: '0.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: koktvatten.id,
            amount: 2.5, // 0.5 tsk ≈ 2.5ml
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: kanel.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: saffran.id,
            amount: 0.5, // 0.5 krm ≈ 0.5g
            displayAmount: '0.5',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda saffran med 1/2 tsk kokt vatten. Låt svalna.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda havregryn, vatten och vanilj kvarg till en smet. Lägg i pajformen och grädda i ugnen (200 °C) 10 min. Låt svalna.',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda eller vispa vanilj kvarg, kesella lätt kvarg, saffran och sötströ. Bred ut den på pajdeg. Dekorera med hallon.. Ät och njut ?!',
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
