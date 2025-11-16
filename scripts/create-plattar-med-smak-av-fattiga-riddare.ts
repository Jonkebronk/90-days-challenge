import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ägg': { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  'Keso mini 1.5%': { calories: 98, protein: 12.4, carbs: 3.4, fat: 4 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Kanel': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Ica sötströ': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kardemumma': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🥞 Creating Plättar med smak av fattiga riddare recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const agg = await findOrCreateFoodItem('Ägg')
  const kesomini = await findOrCreateFoodItem('Keso mini 1.5%')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const kanel = await findOrCreateFoodItem('Kanel')
  const sotstro = await findOrCreateFoodItem('Ica sötströ')
  const kardemumma = await findOrCreateFoodItem('Kardemumma')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Plättar med smak av fattiga riddare',
      description: 'Vill du komma så nära fattiga riddare som möjligt ska du testa detta recept!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/Kj3xDhcT/2025-11-14-12-01-33-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 40,
      carbsPerServing: 35,
      fatPerServing: 18,
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
            foodItemId: kesomini.id,
            amount: 151,
            displayAmount: '151',
            displayUnit: 'g',
          },
          {
            foodItemId: havregryn.id,
            amount: 48,
            displayAmount: '48',
            displayUnit: 'g',
          },
          {
            foodItemId: kanel.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: sotstro.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
          {
            foodItemId: kardemumma.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'portion',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa ihop alla ingredienser förutom kanel och sötströ. Tillsätt vatten tills du tycker du är en bra "pannkakssmet"',
          },
          {
            stepNumber: 2,
            instruction: 'Stek plättar i kokosolja. Ha tålamod, när du ser att de blir en ljusbrun kant samt små bubblor då kan du vända plåttarna',
          },
          {
            stepNumber: 3,
            instruction: 'När du stekt alla plättar strör du över kanel och sötströ',
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
