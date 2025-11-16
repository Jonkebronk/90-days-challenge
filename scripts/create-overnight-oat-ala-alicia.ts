import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Casein Chocklad': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Kokosflingor': { calories: 660, protein: 6, carbs: 7, fat: 65 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥣 Creating Overnight oat ala alicia recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const caseinchocklad = await findOrCreateFoodItem('Casein Chocklad')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const kokosflingor = await findOrCreateFoodItem('Kokosflingor')
  const vatten = await findOrCreateFoodItem('Vatten')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Overnight oat ala alicia',
      description: 'Mycket god overnight oat och går snabbt att göra',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/d1jkFvms/2025-11-14-11-12-21-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 115,
      proteinPerServing: 22,
      carbsPerServing: 2,
      fatPerServing: 2,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: caseinchocklad.id,
            amount: 29,
            displayAmount: '29',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 0,
            displayAmount: '0',
            displayUnit: 'g',
          },
          {
            foodItemId: kokosflingor.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 150, // 1.5 dl = 150ml
            displayAmount: '1.5',
            displayUnit: 'dl',
          },
          {
            foodItemId: sotstro.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börja med att blanda ihop alla torra ingredienser, sen tar i med lite varttan till önskad konsistens. Jag tar ungefär så det blir kladdrigt. Det ska inte bli för vattning. Ställ sedan in i kylen över natten åt nästa morgon med tillbehör du tycker om. Jag gillar hallon och en klick kvarg',
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
