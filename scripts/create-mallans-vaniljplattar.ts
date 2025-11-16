import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Vanilj proteinpulver': { calories: 380, protein: 80, carbs: 8, fat: 5 },
  'Minikeso': { calories: 98, protein: 12.5, carbs: 3.4, fat: 4.3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  "Nick's Vanilj Stevia Drops": { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Mallans vaniljplättar recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const vaniljproteinpulver = await findOrCreateFoodItem('Vanilj proteinpulver')
  const minikeso = await findOrCreateFoodItem('Minikeso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const vatten = await findOrCreateFoodItem('Vatten')
  const steviadrops = await findOrCreateFoodItem("Nick's Vanilj Stevia Drops")

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Mallans vaniljplättar',
      description: 'Lite sötare och extremt goda kesoplättar! Passar alla i familjen.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/Cx2rYsPN/2025-11-14-10-13-09-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 476,
      proteinPerServing: 41,
      carbsPerServing: 34,
      fatPerServing: 19,
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
            foodItemId: vaniljproteinpulver.id,
            amount: 12,
            displayAmount: '12',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 89,
            displayAmount: '89',
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
            amount: 100, // 1 dl = 100ml
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: steviadrops.id,
            amount: 0,
            displayAmount: '3-4',
            displayUnit: 'droppar',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynet till mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Häll ner minikeson, ägget och proteinpulvret i havregrynsmjölet och mixa samman. Addera vatten till rätt pannkakssmets konsistens.',
          },
          {
            stepNumber: 3,
            instruction: '*Valfritt* Droppa i 3-4 droppar Nick\'s vanilj stevia droppar',
          },
          {
            stepNumber: 4,
            instruction: 'Stek i kokosolja',
          },
          {
            stepNumber: 5,
            instruction: 'Toppa med din mängd bär och Walden Farms Pancake Syrup. Voilà!',
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
