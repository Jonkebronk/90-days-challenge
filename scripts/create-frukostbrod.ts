import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Linfröolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'Keso': { calories: 72, protein: 12.6, carbs: 3.6, fat: 0.6 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Stevia eller vaniljpulver (frivilligt, kan bytas ut mot tex lite kanel)': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🍞 Creating Frukostbröd recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const linfroolja = await findOrCreateFoodItem('Linfröolja')
  const keso = await findOrCreateFoodItem('Keso')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const stevia = await findOrCreateFoodItem('Stevia eller vaniljpulver (frivilligt, kan bytas ut mot tex lite kanel)')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Frukostbröd',
      description: 'Gott och krispigt frukostbröd',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/NjRpX2Q1/2025-11-14-11-27-38-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 475,
      proteinPerServing: 24,
      carbsPerServing: 34,
      fatPerServing: 25,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: linfroolja.id,
            amount: 22,
            displayAmount: '22',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
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
            foodItemId: stevia.id,
            amount: 1, // 1 krm ≈ 1g
            displayAmount: '1',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mixa havregrynen så det blir mjöl',
          },
          {
            stepNumber: 2,
            instruction: 'Blanda i en nypa bakpulver, en nypa kanel eller stevia drops samt linfröolja',
          },
          {
            stepNumber: 3,
            instruction: 'Blanda i keso, ta lite i taget då degen lätt blir väldigt kletigt om det blir förmycket',
          },
          {
            stepNumber: 4,
            instruction: 'Sätt in i ugnen ca 15 min på 200grader',
          },
          {
            stepNumber: 5,
            instruction: 'Ta ut brödet, dela det i mitten då det ofta är kladdigt inuti men klart utanpå, lägg in de två delarna i ugnen ytterligare 5 min för att få bort kladdigheten och få brödet krispigt',
          },
          {
            stepNumber: 6,
            instruction: 'Lägg på salladsblad, ett skivat ägg, gurka',
          },
          {
            stepNumber: 7,
            instruction: 'Ät smörgås tillsammans med en skål kvarg',
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
