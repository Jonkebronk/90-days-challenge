import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Mini keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Rismjöl': { calories: 366, protein: 6, carbs: 80, fat: 1.4 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Spenat': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
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
  console.log('🌮 Creating Quesadillas recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfile = await findOrCreateFoodItem('Kycklingfilé')
  const keso = await findOrCreateFoodItem('Mini keso')
  const rismjol = await findOrCreateFoodItem('Rismjöl')
  const paprika = await findOrCreateFoodItem('Paprika')
  const spenat = await findOrCreateFoodItem('Spenat')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Quesadillas',
      description: 'Heta Quesadillas!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/44mFbDH6/2025-11-15-12-15-05-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 53,
      carbsPerServing: 61,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfile.id,
            amount: 153,
            displayAmount: '153',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: rismjol.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g',
          },
          {
            foodItemId: spenat.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Stek paprika i strimlor, spenat och riven vitlök en stund tills allt är mjukt. Ställ åt sidan.',
          },
          {
            stepNumber: 2,
            instruction: 'Strimla kycklingfilén och stek ihop med cayennepeppar, spiskummin & svartpeppar. (Eller Krydda med valfria kryddor)',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda ner paprikan i kycklingen och låt stå',
          },
          {
            stepNumber: 4,
            instruction: 'Sätt på ugnen på 200 grader',
          },
          {
            stepNumber: 5,
            instruction: 'Blanda ihop rismjöl, paprikapulver och lite cayennepeppar, rör i lite vatten så smeten blir lagom lös.',
          },
          {
            stepNumber: 6,
            instruction: 'Smeta ut 2 cirklar av rismjölsmeten på bakplåtspapper. Gör dom ganska tunna. Grädda i ca 5-10 min.',
          },
          {
            stepNumber: 7,
            instruction: 'Ta ut "bröden" och smeta på lite keso, lägg på kyckling/paprikaröra och toppa med lite keso innan du lägger på locket (brödet av rismjöl)',
          },
          {
            stepNumber: 8,
            instruction: 'Tryck till lite och grädda ytterligare i 10minuter.',
          },
          {
            stepNumber: 9,
            instruction: 'Ta ut, låt svalna lite och åt. Kycklingen som inte får plats på brödet får du äta vid sidan av.',
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
