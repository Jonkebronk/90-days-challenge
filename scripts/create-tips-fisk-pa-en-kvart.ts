import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torsk odlad rå': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Joderat salt': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Svartpeppar': { calories: 251, protein: 10, carbs: 64, fat: 3.3 },
  'Citronjuice färskpressad': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
  'Vatten kranvatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Dill färsk': { calories: 43, protein: 3.5, carbs: 7, fat: 1.1 },
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
  console.log('🐟 Creating Fisk på en kvart recipe...\n')

  // Find Tips på tillagning category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'tips-pa-tillagning' }
  })

  if (!category) {
    throw new Error('Tips på tillagning category not found')
  }

  // Create or find all food items
  const torsk = await findOrCreateFoodItem('Torsk odlad rå')
  const salt = await findOrCreateFoodItem('Joderat salt')
  const peppar = await findOrCreateFoodItem('Svartpeppar')
  const citronjuice = await findOrCreateFoodItem('Citronjuice färskpressad')
  const vatten = await findOrCreateFoodItem('Vatten kranvatten')
  const dill = await findOrCreateFoodItem('Dill färsk')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fisk på en kvart',
      description: 'Snabb och enkel fiskrätt som är klar på 15 minuter. Perfekt för vardagsmiddag!',
      categoryId: category.id,
      servings: 4,
      coverImage: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      caloriesPerServing: 123,
      proteinPerServing: 27,
      carbsPerServing: 2,
      fatPerServing: 1,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torsk.id,
            amount: 600,
            displayAmount: '600',
            displayUnit: 'g',
          },
          {
            foodItemId: salt.id,
            amount: 5,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: peppar.id,
            amount: 1,
            displayAmount: '0.2',
            displayUnit: 'tsk',
          },
          {
            foodItemId: citronjuice.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: vatten.id,
            amount: 100,
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: dill.id,
            amount: 100,
            displayAmount: '1',
            displayUnit: 'dl',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'TIPS: Fiskblock från frysen i centimeterljocka skivor duger till vardags, men välj gärna fina fiskfiléer när det ska vara lite festligare.',
          },
          {
            stepNumber: 2,
            instruction: 'Krydda fiskfiléerna med salt och peppar. Pressa över lite citronsaft.',
          },
          {
            stepNumber: 3,
            instruction: 'Lägg i fiskfiléerna.',
          },
          {
            stepNumber: 4,
            instruction: 'Sjud under lock i 5-10 minuter. När fisken vitnat och lätt faller sönder är den klar.',
          },
          {
            stepNumber: 5,
            instruction: 'Överkoka inte! Garnera gärna med färska örter vid serveringen.',
          },
          {
            stepNumber: 6,
            instruction: 'Servera gärna med kokt, pressad potatis och valfria grönsaker.',
          },
        ],
      },
    },
  })

  console.log(`✅ Recipe created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - ${recipe.servings} portioner`)
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
