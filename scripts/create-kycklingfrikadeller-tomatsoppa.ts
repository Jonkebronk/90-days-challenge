import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfärs': { calories: 172, protein: 20.5, carbs: 0, fat: 9.5 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Gul lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Krossade tomater': { calories: 32, protein: 1.6, carbs: 7, fat: 0.2 },
  'Färsk chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Hönsbulljong': { calories: 15, protein: 1, carbs: 2, fat: 0.5 },
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
  console.log('🍲 Creating Kycklingfrikadeller i tomat- och potatissoppa recipe...\n')

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
  const tomater = await findOrCreateFoodItem('Krossade tomater')
  const chili = await findOrCreateFoodItem('Färsk chili')
  const bulljong = await findOrCreateFoodItem('Hönsbulljong')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kycklingfrikadeller i tomat- och potatissoppa',
      description: 'Grymt god och mättande soppa, bra att göra många portioner att ha i kylen och bara micra på sen.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/qMhQypnH/2025-11-15-11-56-13-NVIDIA-Ge-Force-Overlay-DT.png',
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
            amount: 50,
            displayAmount: '50',
            displayUnit: 'g',
          },
          {
            foodItemId: tomater.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: chili.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: bulljong.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Grovhacka gullök och potatis',
          },
          {
            stepNumber: 2,
            instruction: 'Finhacka chili och pressa vitlöken',
          },
          {
            stepNumber: 3,
            instruction: 'Fräs allt ovan i ett par minuter i kokosolja i en stor kastrull, tills det får fin färg',
          },
          {
            stepNumber: 4,
            instruction: 'Häll på vatten så att potatisarna täcks, låt koka i ca 10 min under lock (tillsätt ev buljongtärning)',
          },
          {
            stepNumber: 5,
            instruction: 'Under tiden rullar du bollar à 25g av kycklingfärsen. Blanda gärna i svartpeppar och lite lite salt innan du rullar dem.',
          },
          {
            stepNumber: 6,
            instruction: 'När potatisen kokat klart häller du på krossade tomaterna, svartpeppar och ev oregano eller basilika',
          },
          {
            stepNumber: 7,
            instruction: 'Mixa allt med stavmixer (alt låt svalna och kör i blender)',
          },
          {
            stepNumber: 8,
            instruction: 'Koka upp soppan och lägg i kycklingfrikadellerna. låt dem koka ca 10-15 minuter.',
          },
          {
            stepNumber: 9,
            instruction: 'Klart att äta!',
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
