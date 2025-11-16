import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötkött': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Tomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Morot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
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
  console.log('🍲 Creating Köttgryta recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notkott = await findOrCreateFoodItem('Nötkött')
  const ris = await findOrCreateFoodItem('Ris')
  const tomater = await findOrCreateFoodItem('Tomater')
  const lok = await findOrCreateFoodItem('Lök')
  const morot = await findOrCreateFoodItem('Morot')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Köttgryta',
      description: 'En god och enkel köttgryta som typ sköter sig själv.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/434TJWL5/2025-11-15-12-23-16-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 45,
      carbsPerServing: 60,
      fatPerServing: 8,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notkott.id,
            amount: 152,
            displayAmount: '152',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 93,
            displayAmount: '93',
            displayUnit: 'g',
            notes: 'eller krossade tomater'
          },
          {
            foodItemId: lok.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: morot.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skär upp morot och lök, lägg det i en kastrull tillsammans med tomater och vatten',
          },
          {
            stepNumber: 2,
            instruction: 'Bryn köttet med peppar, timjan och lite salt.',
          },
          {
            stepNumber: 3,
            instruction: 'När köttet är brynr, lägg ner det i kastrullen med grönsakerna, tillsätt en bit lagerblad i grytan, starta plåttan så det kokar upp. Sänk sedan till låg värme och låt det koka i ca 2 timmar. Rör någon gång ibland och tillsätt vatten när det behövs så det inte bränner fast i botten.',
          },
          {
            stepNumber: 4,
            instruction: 'När grytan börjar bli klar, tillaga riset så det är klart samtidigt.',
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
