import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torsk': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Röd paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Ruccola': { calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7 },
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
  console.log('🐟 Creating Fisk i grönt sällskap recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torsk = await findOrCreateFoodItem('Torsk')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const rodPaprika = await findOrCreateFoodItem('Röd paprika')
  const ruccola = await findOrCreateFoodItem('Ruccola')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fisk i grönt sällskap',
      description: 'En nyttig, smakrik och enkel fiskrätt!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/x18Lm247/2025-11-15-12-53-26-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torsk.id,
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
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: rodPaprika.id,
            amount: 133,
            displayAmount: '133',
            displayUnit: 'g',
          },
          {
            foodItemId: ruccola.id,
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 225°C',
          },
          {
            stepNumber: 2,
            instruction: 'Skrubba potatisen och skär den i bitar. Lägg potatisen på bakplåtsklädd plåt. Krydda med peppar. Stek i övre delen av ugnen i 15-20 min tills den är nästan färdigstekt',
          },
          {
            stepNumber: 3,
            instruction: 'Skala och klyfta löken. Skölj, käins ur och skär paprikan i bitar',
          },
          {
            stepNumber: 4,
            instruction: 'Skär fisken i bitar och lägg på ett smort ugnssäkert fat. Krydda med peppar och lite örtsalt',
          },
          {
            stepNumber: 5,
            instruction: 'Sänk värmen till 175 grader. Lägg grönsakerna tillsammans med potatisen på plåten. Sätt in fisken på ett galler under plåten. Stek allt i ca 15 min.',
          },
          {
            stepNumber: 6,
            instruction: 'Blanda potatis och grönsaler med ruccola, ochh ägg fisken ovanpå. Servera!',
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
