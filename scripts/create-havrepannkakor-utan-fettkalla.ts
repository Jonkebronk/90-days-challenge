import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Äggvita': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  'Havregryn eller havremjöl': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Lättstro/sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kanel': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
  'Kardemumma': { calories: 311, protein: 11, carbs: 68, fat: 7 },
  'Saffran': { calories: 310, protein: 11, carbs: 65, fat: 6 },
  'Vaniljpulver': { calories: 288, protein: 0.1, carbs: 12.6, fat: 0.1 },
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
  console.log('🥞 Creating Havrepannkakor utan fettkälla recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const aggvita = await findOrCreateFoodItem('Äggvita')
  const havregryn = await findOrCreateFoodItem('Havregryn eller havremjöl')
  const vatten = await findOrCreateFoodItem('Vatten')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const lattstro = await findOrCreateFoodItem('Lättstro/sötströ')
  const salt = await findOrCreateFoodItem('Salt')
  const kanel = await findOrCreateFoodItem('Kanel')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')
  const saffran = await findOrCreateFoodItem('Saffran')
  const vaniljpulver = await findOrCreateFoodItem('Vaniljpulver')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Havrepannkakor utan fettkälla',
      description: 'En frukost som är perfekt för oss utan fettkälla på mål 1, eller vill toppa med jordnötssmör',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/7LKqVcKv/2025-11-14-10-35-20-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 292,
      proteinPerServing: 30,
      carbsPerServing: 29,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: aggvita.id,
            amount: 247,
            displayAmount: '247',
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
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: lattstro.id,
            amount: 2.5, // 0.5 msk ≈ 2.5g
            displayAmount: '0.5',
            displayUnit: 'msk',
          },
          {
            foodItemId: salt.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: kardemumma.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: saffran.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
          {
            foodItemId: vaniljpulver.id,
            amount: 1,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynen till ett mjöl om ni inte har havremjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda samman alla ingredienser och stek på medelhög värme. Ha tålamod och vänd inte för tidigt',
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
