import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 120, protein: 21, carbs: 0, fat: 4 },
  'Sötpotatis': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'Rödbeta': { calories: 43, protein: 1.6, carbs: 10, fat: 0.2 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
  'Sambal oelek': { calories: 40, protein: 1, carbs: 8, fat: 0.5 },
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
  console.log('🍗 Creating Heta kycklingfärsspett recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const sotpotatis = await findOrCreateFoodItem('Sötpotatis')
  const rodbeta = await findOrCreateFoodItem('Rödbeta')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const persilja = await findOrCreateFoodItem('Persilja')
  const sambalOelek = await findOrCreateFoodItem('Sambal oelek')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Heta kycklingfärsspett',
      description: 'Heta kycklingfärsspett med sötpotatis och rödbetorr.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/NfMtqJnb/2025-11-15-12-45-43-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 54,
      carbsPerServing: 65,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kycklingfars.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
          },
          {
            foodItemId: sotpotatis.id,
            amount: 292,
            displayAmount: '292',
            displayUnit: 'g',
          },
          {
            foodItemId: rodbeta.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: vitlok.id,
            amount: 7,
            displayAmount: '7',
            displayUnit: 'g',
          },
          {
            foodItemId: persilja.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
          {
            foodItemId: sambalOelek.id,
            amount: 10,
            displayAmount: '2',
            displayUnit: 'tsk',
            notes: 'cirka 10ml',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Forma kycklingfärs runt 2 st grillspett.',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda kycklingfärsen med persilja, pressad vitlök, sambal oelek och peppar. Låt vila.',
          },
          {
            stepNumber: 3,
            instruction: 'Skala och hacka rödbetorna och sötpotatisen. Lägg på en plåt med bakplåtspapper. Häll över lite rapsolja och krydda med peppar och timjan. Ställ in i ugnen i ca 30-40 minuter på 225 grader.',
          },
          {
            stepNumber: 4,
            instruction: 'Grilla dessa i ugnen på bakpappersklädd plåt, ca 15 minuter vid 225 grader',
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
