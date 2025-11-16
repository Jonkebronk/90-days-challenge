import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torskrygg': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Ärtor': { calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4 },
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
  console.log('🐟 Creating Danielles Torskrygg med ärtröra recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torskrygg = await findOrCreateFoodItem('Torskrygg')
  const potatis = await findOrCreateFoodItem('Potatis')
  const artor = await findOrCreateFoodItem('Ärtor')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Danielles Torskrygg med ärtröra',
      description: 'Fräscht och gott torskrecept! Pressad potatis med ärtröra och torskrygg.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/DzWQ9TQ7/2025-11-15-12-52-45-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torskrygg.id,
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
            foodItemId: artor.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala och skär potatis i mindre bitar och koka tills fe är mjuka',
          },
          {
            stepNumber: 2,
            instruction: 'Placera torskryggen i ugnform och krydda med peppar, dill samt skal och juice från en halv riven citron. Ha fisken i ugnen tills den är 56c i innertemperatur ca 15-20 min på 150 grader',
          },
          {
            stepNumber: 3,
            instruction: 'Tina ärtor i vatten i mikron ca 2 minuter. Häll av vattnet och mixa ärtorna tillsammans med pressad vitlök ca 1 klyfta och juicen samt skal från en halv citron. Salta och peppra vid behov.',
          },
          {
            stepNumber: 4,
            instruction: 'När potatisen är klar så häll av vattnet och blanda potatisbitarna med persilja och gräslök och pressa potatisen med en potatispress.',
          },
          {
            stepNumber: 5,
            instruction: 'Smeta ut ärtröran på tallriken och placera fisken ovanpå',
          },
          {
            stepNumber: 6,
            instruction: 'Klipp lite gräslök över',
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
