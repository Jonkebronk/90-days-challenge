import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 172, protein: 20.5, carbs: 0, fat: 9.5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Plommontomater': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
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
  console.log('🍗 Creating Tessis kycklingbiffar recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kycklingfars = await findOrCreateFoodItem('Kycklingfärs')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const tomater = await findOrCreateFoodItem('Plommontomater')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Tessis kycklingbiffar',
      description: 'Enkelt recept som passar bra till lunchmatlådan eller middag! Passar hela familjen!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/mZ53jKNh/2025-11-15-12-13-46-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
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
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 180,
            displayAmount: '180',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda färsen med hackad lök & kryddor.',
          },
          {
            stepNumber: 2,
            instruction: 'Forma till biffar & stek i kokosolja och några färska basilikablad',
          },
          {
            stepNumber: 3,
            instruction: 'Skär upp potatisen i klyftor, lägg på en plåt, häll över lite smält kokosolja och ställ in i ugnen på ca 220 grader varmluft tills gyllenbrun.',
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
