import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torskfilé': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Grön sparris': { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  'Rädisor': { calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1 },
  'Sockerärtor': { calories: 42, protein: 2.8, carbs: 7.6, fat: 0.2 },
  'Citron': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
  'Dill': { calories: 43, protein: 3.5, carbs: 7, fat: 1.1 },
  'Citronjuice': { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2 },
  'Persilja': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8 },
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
  console.log('🐟 Creating Torskpaket med kokt potatis samt en sparris och rädissallad recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torskfile = await findOrCreateFoodItem('Torskfilé')
  const potatis = await findOrCreateFoodItem('Potatis')
  const gronSparris = await findOrCreateFoodItem('Grön sparris')
  const radisor = await findOrCreateFoodItem('Rädisor')
  const sockerartor = await findOrCreateFoodItem('Sockerärtor')
  const citron = await findOrCreateFoodItem('Citron')
  const dill = await findOrCreateFoodItem('Dill')
  const citronjuice = await findOrCreateFoodItem('Citronjuice')
  const persilja = await findOrCreateFoodItem('Persilja')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Torskpaket med kokt potatis samt en sparris och rädissallad',
      description: 'Den perfekta sommarrätten! Använd gärna grillen för torskpaketen!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/y6nP3vN6/2025-11-15-13-03-41-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
      carbsPerServing: 58,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torskfile.id,
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
            foodItemId: gronSparris.id,
            amount: 150,
            displayAmount: '150',
            displayUnit: 'g',
          },
          {
            foodItemId: radisor.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
            notes: 'delade i färdedelar',
          },
          {
            foodItemId: sockerartor.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
            notes: 'delade i två',
          },
          {
            foodItemId: citron.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
            notes: 'skivad',
          },
          {
            foodItemId: dill.id,
            amount: 45,
            displayAmount: '3',
            displayUnit: 'msk',
            notes: 'färsk och plockad',
          },
          {
            foodItemId: citronjuice.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: persilja.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
            notes: 'färsk och hackad',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 200 grader. Under sommartid så är detta perfekt att dra på grillen.',
          },
          {
            stepNumber: 2,
            instruction: 'Riv folie papper som är tillräckligt stora för att rymma en portion torsk i.',
          },
          {
            stepNumber: 3,
            instruction: 'Skär torsken i portionsstorlekar, för 300 g så är det två portioner. Lägg bitarna i foliepapper och täck med dill och citronsklvor. Försut foliepaketet.',
          },
          {
            stepNumber: 4,
            instruction: 'Koka potatis med dill.',
          },
          {
            stepNumber: 5,
            instruction: 'När ugnen är varm så lägger du i torskpaketen. Det beror på hur "tjock" del på torsken du använder men det borde ta ca 15-20 minuter innan den är helt klar. Öppna paketet och dubbelkolla om du är osäker.',
          },
          {
            stepNumber: 6,
            instruction: 'Skär sparrisen delad i 2 cm stenrar. De söta tre cm på sparrisen används inte då den delar är väldigt träig. radisorna och sockerärorna och blanda med citron, peppar och persilja.',
          },
          {
            stepNumber: 7,
            instruction: 'Njut!',
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
