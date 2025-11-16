import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Räkor (skalade)': { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  'Ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'Purjolök': { calories: 61, protein: 1.5, carbs: 14, fat: 0.3 },
  'Tomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'Gul paprika': { calories: 27, protein: 1, carbs: 6, fat: 0.3 },
  'Röd Chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Piripiri krydda': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Vitlöksklyftor': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
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
  console.log('🍤 Creating Het Piri Piri räkwok recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const rakor = await findOrCreateFoodItem('Räkor (skalade)')
  const ris = await findOrCreateFoodItem('Ris')
  const purjolok = await findOrCreateFoodItem('Purjolök')
  const tomater = await findOrCreateFoodItem('Tomater')
  const paprika = await findOrCreateFoodItem('Gul paprika')
  const chili = await findOrCreateFoodItem('Röd Chili')
  const piripiri = await findOrCreateFoodItem('Piripiri krydda')
  const vitlok = await findOrCreateFoodItem('Vitlöksklyftor')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Het Piri Piri räkwok',
      description: 'Stark rätt med inspiration av Asien, inte något för den som gillar mildare mat',
      categoryId: category.id,
      servings: 1,
      coverImage: '', // TODO: Add PostImage URL
      caloriesPerServing: 511,
      proteinPerServing: 53,
      carbsPerServing: 60,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: rakor.id,
            amount: 225,
            displayAmount: '225',
            displayUnit: 'g',
            notes: 'Skalade'
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: purjolok.id,
            amount: 56,
            displayAmount: '56',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 89,
            displayAmount: '89',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 56,
            displayAmount: '56',
            displayUnit: 'g',
          },
          {
            foodItemId: chili.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: piripiri.id,
            amount: 10, // 2 tsk ≈ 10g
            displayAmount: '2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: vitlok.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Koka ris enligt anvisning på förpackning (viktigt att riset nästintill är färdigt innan du börjar woka).',
          },
          {
            stepNumber: 2,
            instruction: 'Värm 1 msk kokosolja i en wok/stekpanna',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka purjolök, paprika och tomat. Finhacka chili och vitlök',
          },
          {
            stepNumber: 4,
            instruction: 'Lägg i purjolök, paprika, chili, tomat och piripiri krydda. Woka på hög värme i ca 3 minuter',
          },
          {
            stepNumber: 5,
            instruction: 'Tillsätt ris och 3 msk vatten. Woka i ca 4 minuter',
          },
          {
            stepNumber: 6,
            instruction: 'Tillsätt 1 msk kokosolja, räkor, babyspenat och vitlök. Woka i ca 2 min tills räkorna är rosa och genomstekta',
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
  console.log('\n⚠️  Note: Cover image URL not provided - recipe created without cover image')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
