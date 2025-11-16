import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Linfrön': { calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2 },
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Keso mini': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
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
  console.log('🍪 Creating Kesotekakor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const linfron = await findOrCreateFoodItem('Linfrön')
  const agg = await findOrCreateFoodItem('Ägg')
  const kesomini = await findOrCreateFoodItem('Keso mini')
  const havremjol = await findOrCreateFoodItem('Havremjöl')
  const vatten = await findOrCreateFoodItem('Vatten')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kesotekakor',
      description: 'Tekakor på keso och havre',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/V6CgWS8t/2025-11-14-11-10-00-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 465,
      proteinPerServing: 39,
      carbsPerServing: 35,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: linfron.id,
            amount: 30, // 2 msk ≈ 30g
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: agg.id,
            amount: 123,
            displayAmount: '123',
            displayUnit: 'g',
          },
          {
            foodItemId: kesomini.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havremjol.id,
            amount: 48,
            displayAmount: '48',
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
            instruction: 'Lägg havremjöl och linfrön i en bunke',
          },
          {
            stepNumber: 2,
            instruction: 'Häll i vatten och keso och rör runt',
          },
          {
            stepNumber: 3,
            instruction: 'Bred ut till 3-4 platta bröd på en bakplåt med bakplåtspapper',
          },
          {
            stepNumber: 4,
            instruction: 'Grädda i mitten av ugnen, 175° varmluft eller 200° över/undervärme i ca 20 min',
          },
          {
            stepNumber: 5,
            instruction: 'Koka ägget, skiva och lägg på tekakorna',
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
