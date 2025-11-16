import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
  'Slenderchefs sweetchillisås': { calories: 50, protein: 0.5, carbs: 12, fat: 0.1 },
  'Lärsz yoghurt': { calories: 61, protein: 10, carbs: 4, fat: 0.2 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
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
  console.log('🧄 Creating Vitlökssås recipe...\n')

  // Find Sås category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'sas' }
  })

  if (!category) {
    throw new Error('Sås category not found')
  }

  // Create or find all food items
  const persilja = await findOrCreateFoodItem('Persilja')
  const sweetchillisas = await findOrCreateFoodItem('Slenderchefs sweetchillisås')
  const yoghurt = await findOrCreateFoodItem('Lärsz yoghurt')
  const svartpeppar = await findOrCreateFoodItem('Svartpeppar')
  const vitloksklyftor = await findOrCreateFoodItem('Vitlöksklyftor')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Vitlökssås',
      description: 'Vem vill inte ha sås till maten? Denna kan du variera i all oändlighet.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/28W81XzX/2025-11-15-13-29-54-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 100,
      proteinPerServing: 16,
      carbsPerServing: 8,
      fatPerServing: 1,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: persilja.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sweetchillisas.id,
            amount: 15,
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: yoghurt.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: svartpeppar.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: vitloksklyftor.id,
            amount: 6,
            displayAmount: '2',
            displayUnit: 'klyftor',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda ihop allt och ställ kallt. Smaka av tills du är nöjd. Servera och njut! Såsen kan även blandas med enbart sweetchillisås och utesluta vitlöken för att passa till tex fisk.',
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
