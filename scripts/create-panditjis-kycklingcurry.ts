import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Hela tomater': { calories: 32, protein: 1.6, carbs: 4.5, fat: 0.3 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Tomatpuré': { calories: 82, protein: 4.3, carbs: 16, fat: 0.5 },
  'Ingefära': { calories: 80, protein: 1.8, carbs: 18, fat: 0.8 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Olja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
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
  console.log('🍛 Creating Panditjis kycklingcurry recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kycklingfilé')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const tomater = await findOrCreateFoodItem('Hela tomater')
  const vatten = await findOrCreateFoodItem('Vatten')
  const tomatpure = await findOrCreateFoodItem('Tomatpuré')
  const ingefara = await findOrCreateFoodItem('Ingefära')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const olja = await findOrCreateFoodItem('Olja')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Panditjis kycklingcurry',
      description: 'Panditjis kycklingcurry',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/XvHzn2dT/2025-11-14-13-44-13-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 54,
      carbsPerServing: 60,
      fatPerServing: 4,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: kyckling.id,
            amount: 182,
            displayAmount: '182',
            displayUnit: 'g',
            notes: 'i bitar, eller 1 hel kyckling, cirka 1.5 kg'
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 46,
            displayAmount: '46',
            displayUnit: 'g',
            notes: 'finhackad stor lök, gärna rödlök'
          },
          {
            foodItemId: tomater.id,
            amount: 154,
            displayAmount: '154',
            displayUnit: 'g',
            notes: 'Burk hela tomater eller krossade tomater (1-2 burkar)'
          },
          {
            foodItemId: vatten.id,
            amount: 500, // 5 dl
            displayAmount: '5',
            displayUnit: 'dl',
          },
          {
            foodItemId: tomatpure.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
          {
            foodItemId: ingefara.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
            notes: '2x2 cm'
          },
          {
            foodItemId: vitlok.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
            notes: 'stor vitlöksklyfta'
          },
          {
            foodItemId: olja.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'tsk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Dela kycklingen i cirka 3x3 cm stora bitar. Avlägsna gärna skinnet där det går lätt. Eller använd kycklingfilé',
          },
          {
            stepNumber: 2,
            instruction: 'Gör en kryddblandning av kanel, nejlika, svartpeppar och muskot.',
          },
          {
            stepNumber: 3,
            instruction: 'Hacka ingefära och vitlök till en pasta med kniv eller i en mixer',
          },
          {
            stepNumber: 4,
            instruction: 'Finhacka den röda/gula löken.',
          },
          {
            stepNumber: 5,
            instruction: 'Hetta upp oljan i en medelstor gryta. Kör dem till en jämn puré, ställ åt sidan',
          },
          {
            stepNumber: 6,
            instruction: 'Hetta upp oljan i en wokpanna. Fräs spiskummin, cayenne/chiliflakes, skört senapsfro, gurkmeja i oljan, tillsätt den finhackade löken och bryn den tills den har fått fin färg, men akta så att den inte bränns.',
          },
          {
            stepNumber: 7,
            instruction: 'Tillsätt salt, socker, den malda kryddblandningen och några deciliter av vattnet.',
          },
          {
            stepNumber: 8,
            instruction: 'Rör om.',
          },
          {
            stepNumber: 9,
            instruction: 'Tillsätt vitlök- och ingefärspasta. Låt koka cirka 5 minuter eller tills oljan stiger till ytan',
          },
          {
            stepNumber: 10,
            instruction: 'Tillsätt tomatmixen och tomatpuren, låt koka upp och rör om.',
          },
          {
            stepNumber: 11,
            instruction: 'Lägg till sist i kycklingdelarna. Späd med vattnet så att det blir lagom mycket vätska i pannan. Koka 30–40 minuter på låg värme. Smaka av med salt.',
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
