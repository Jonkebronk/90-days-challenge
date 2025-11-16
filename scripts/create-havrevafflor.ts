import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Keso': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Kalkonbacon': { calories: 130, protein: 21, carbs: 1, fat: 4.5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🧇 Creating Havrevåfflor med ägg och kalkonbacon recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const keso = await findOrCreateFoodItem('Keso')
  const kalkonbacon = await findOrCreateFoodItem('Kalkonbacon')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Havrevåfflor med ägg och kalkonbacon',
      description: 'Perfekt som lyxigare helgfrukost!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/FzvK7cRJ/2025-11-14-10-00-52-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 44,
      carbsPerServing: 31,
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
            foodItemId: keso.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: kalkonbacon.id,
            amount: 80,
            displayAmount: '80',
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
            amount: 60, // 4 msk ≈ 60ml
            displayAmount: '4',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregryn, keso, vatten och ett av äggen till en jämn smet',
          },
          {
            stepNumber: 2,
            instruction: 'Peppra smeten efter smak',
          },
          {
            stepNumber: 3,
            instruction: 'Häll smeten i ett våffeljärn och stek den krispig',
          },
          {
            stepNumber: 4,
            instruction: 'Stek under tiden det andra ägget och kalkonbaconet',
          },
          {
            stepNumber: 5,
            instruction: 'Servera med grönsaker',
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
