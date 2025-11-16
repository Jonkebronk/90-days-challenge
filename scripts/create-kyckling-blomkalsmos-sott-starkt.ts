import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Sötpotatis': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'Blomkål': { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  'Basilika': { calories: 23, protein: 3.2, carbs: 2.7, fat: 0.6 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Färsk chilipeppar': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
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
  console.log('🍗 Creating Kyckling med blomkålsmos, sött och starkt recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kycklingfilé')
  const keso = await findOrCreateFoodItem('Keso')
  const sotpotatis = await findOrCreateFoodItem('Sötpotatis')
  const blomkal = await findOrCreateFoodItem('Blomkål')
  const basilika = await findOrCreateFoodItem('Basilika')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const chili = await findOrCreateFoodItem('Färsk chilipeppar')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Kyckling med blomkålsmos, sött och starkt',
      description: 'Saftig kyckling med, sötpotatis pommes. Ett gott blomkålsmos och en härlig stark röra',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/x1Xddx4g/2025-11-14-14-33-10-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 52,
      carbsPerServing: 66,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 159,
            displayAmount: '159',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 32,
            displayAmount: '32',
            displayUnit: 'g',
          },
          {
            foodItemId: sotpotatis.id,
            amount: 232,
            displayAmount: '232',
            displayUnit: 'g',
          },
          {
            foodItemId: blomkal.id,
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
            instruction: 'Lägg in kyckling i ugnen. Koka blomkål. Skala och gör pommes av sötpotatis och in i ugnen.',
          },
          {
            stepNumber: 2,
            instruction: 'När blomkålen är mjuk. häll av den och mixa med lite keso',
          },
          {
            stepNumber: 3,
            instruction: 'Gör en röra av färsk basilika, vitlök och chilipeppar som du hackat fint. Blanda med lite vatten. eventuellt en klick smålt kokosolja utan smak för bättre konsistens',
          },
          {
            stepNumber: 4,
            instruction: 'Krydda kyckling och mos med valfria kryddor. Jag gillar att ha i vitpeppar i moset. D-Mängden i receptet får nu utgå ifrån er mängd i ert schema!',
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
