import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg (1 st)': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Mixade havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Kolsyrat vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kryddor som tex kanel eller kardemumma': { calories: 247, protein: 4, carbs: 81, fat: 1.2 },
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
  console.log('🧇 Creating Mickans frasvåfflor recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg (1 st)')
  const mixadehavregryn = await findOrCreateFoodItem('Mixade havregryn')
  const kolsyratvatten = await findOrCreateFoodItem('Kolsyrat vatten')
  const kryddor = await findOrCreateFoodItem('Kryddor som tex kanel eller kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Mickans frasvåfflor',
      description: 'Supergoda våfflor där du väljer konsistensen själv beroende på vattenmängd och grädднingstid.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/y6GY2k06/2025-11-14-10-55-29-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 361,
      proteinPerServing: 21,
      carbsPerServing: 30,
      fatPerServing: 17,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: agg.id,
            amount: 130,
            displayAmount: '130',
            displayUnit: 'g (1 st)',
          },
          {
            foodItemId: mixadehavregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: kolsyratvatten.id,
            amount: 0,
            displayAmount: 'önskad mängd',
            displayUnit: '',
          },
          {
            foodItemId: kryddor.id,
            amount: 0,
            displayAmount: 'efter smak',
            displayUnit: '',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Knäck ägget',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda i de mixade havregrynen',
          },
          {
            stepNumber: 3,
            instruction: 'Tillsätt önskad mängd kolsyrat vatten (blir frasigare då)',
          },
          {
            stepNumber: 4,
            instruction: 'Tillsätt de kryddor du önskar som tex kardemumma, kanel eller vaniljpulver',
          },
          {
            stepNumber: 5,
            instruction: 'Grädda i våffeljarn till önskad färg',
          },
          {
            stepNumber: 6,
            instruction: 'Servera direkt tillsammans med kvarg eller propud och bär. NJUT!',
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
