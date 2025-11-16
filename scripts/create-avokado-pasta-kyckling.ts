import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Larsas yoghurt': { calories: 60, protein: 10, carbs: 4, fat: 0.2 },
  'Kycklingkebab': { calories: 150, protein: 20, carbs: 3, fat: 6 },
  'Spagetti': { calories: 371, protein: 13, carbs: 75, fat: 1.5 },
  'Cocktail tomat': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Avokado': { calories: 160, protein: 2, carbs: 9, fat: 15 },
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
  console.log('🥑 Creating Avokado pasta med kyckling recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const larsasYoghurt = await findOrCreateFoodItem('Larsas yoghurt')
  const kycklingkebab = await findOrCreateFoodItem('Kycklingkebab')
  const spagetti = await findOrCreateFoodItem('Spagetti')
  const cocktailTomat = await findOrCreateFoodItem('Cocktail tomat')
  const avokado = await findOrCreateFoodItem('Avokado')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Avokado pasta med kyckling',
      description: 'En god & krämig pastasallad med kyckling & avokado. Snabb, enkel & framför allt god!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nzDkDJM0/2025-11-15-12-52-00-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 53,
      carbsPerServing: 61,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: larsasYoghurt.id,
            amount: 37,
            displayAmount: '37',
            displayUnit: 'g',
          },
          {
            foodItemId: kycklingkebab.id,
            amount: 155,
            displayAmount: '155',
            displayUnit: 'g',
          },
          {
            foodItemId: spagetti.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: cocktailTomat.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: avokado.id,
            amount: 60,
            displayAmount: '60',
            displayUnit: 'g',
            notes: 'Ta från frukost eller mellanmål',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börja med att koka pastan',
          },
          {
            stepNumber: 2,
            instruction: 'Stek under tiden kycklingen',
          },
          {
            stepNumber: 3,
            instruction: 'Medans pastan väntas på att bli klar mosa avokadon. Som sedans blandas med larsas, pressad vitlök & örtsalt.',
          },
          {
            stepNumber: 4,
            instruction: 'När kycklingen är stekt & pastan klar blanda sammen allt med såsen & cocktail tomater i önskad mängd',
          },
          {
            stepNumber: 5,
            instruction: 'Klar att äta!',
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
