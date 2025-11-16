import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Nötfärs 5%': { calories: 155, protein: 21, carbs: 0, fat: 5 },
  'Mini keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Kikärtspasta': { calories: 337, protein: 17, carbs: 54, fat: 4.6 },
  'Passerade tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Röd paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Pressad citron': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
  'Sotstro': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍝 Creating Saftiga biffar med paprika o tomatsås recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const notfars = await findOrCreateFoodItem('Nötfärs 5%')
  const minikeso = await findOrCreateFoodItem('Mini keso')
  const kikartspasta = await findOrCreateFoodItem('Kikärtspasta')
  const tomater = await findOrCreateFoodItem('Passerade tomater')
  const paprika = await findOrCreateFoodItem('Röd paprika')
  const gullok = await findOrCreateFoodItem('Gul lök')
  const citron = await findOrCreateFoodItem('Pressad citron')
  const sotstro = await findOrCreateFoodItem('Sotstro')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Saftiga biffar med paprika o tomatsås',
      description: 'Saftiga nötfärsbiffar i tomatsås med paprika.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/rsFXfdGL/2025-11-14-13-40-46-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 45,
      carbsPerServing: 60,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: notfars.id,
            amount: 143,
            displayAmount: '143',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 16,
            displayAmount: '16',
            displayUnit: 'g',
          },
          {
            foodItemId: kikartspasta.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 35,
            displayAmount: '35',
            displayUnit: 'g',
          },
          {
            foodItemId: gullok.id,
            amount: 15,
            displayAmount: '15',
            displayUnit: 'g',
          },
          {
            foodItemId: citron.id,
            amount: 1,
            displayAmount: '0.5',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börja med såsen. Hacka gul lök och vitlök i mkt små bitar. Fräs dem i oljan i en kastrull. När löken är gängse tillsätt paprikapulver som får fräsa med en minut.',
          },
          {
            stepNumber: 2,
            instruction: 'Hacka paprikan i små bitar och tillsätt i kastrullen tillsammans med löken. Rör runt och fräs en minut.',
          },
          {
            stepNumber: 3,
            instruction: 'Häll på passerade tomater och rör ner svartpeppar, pressad citron, sotstro och oregano.',
          },
          {
            stepNumber: 4,
            instruction: 'Låt såsen puttra ihop några minuter. Smaka av med liiite salt för att balansera syran. Sist av allt tillsätt persilja efter tycke och smak.',
          },
          {
            stepNumber: 5,
            instruction: 'Dax för biffarna. Mosa kesson i en bunke med en gaffel. Pudra på vitpeppar efter tycke. Rör ihop. Lägg ner 5% nötfärs och blanda allt noga. Peppra med lite svartpeppar och knåda ihop. Forma 8 stycken lika stora biffar. Tillaga på bakplåtspapper i 180 grader varmlufttsugn, eller i airfryer, eller 200 gradig vanlig ugn i ca 10 minuter.',
          },
          {
            stepNumber: 6,
            instruction: 'Medan biffarna tillagas kokas pastan.',
          },
          {
            stepNumber: 7,
            instruction: 'Blanda samman tomatssåsen med pastan och servera med biffarna och något gott grönt till.',
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
