import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Salmalax': { calories: 142, protein: 20, carbs: 0, fat: 6.3 },
  'Ris (torrvikt)': { calories: 365, protein: 7, carbs: 80, fat: 0.6 },
  'Sojabönor': { calories: 147, protein: 13, carbs: 11, fat: 6.4 },
  'Sockerärtor': { calories: 42, protein: 2.8, carbs: 7.5, fat: 0.2 },
  'Rödlök': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'Salladslök': { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Gurka': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  'Morot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'Sweet Chili Sås': { calories: 120, protein: 0, carbs: 30, fat: 0 },
  'Limesaft': { calories: 25, protein: 0.4, carbs: 8.4, fat: 0.1 },
  'Sotstro': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Rostade sesamfrön': { calories: 573, protein: 18, carbs: 23, fat: 50 },
  'Avokado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
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
  console.log('🍣 Creating Ellis pokébowl recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const salmalax = await findOrCreateFoodItem('Salmalax')
  const ris = await findOrCreateFoodItem('Ris (torrvikt)')
  const sojabonor = await findOrCreateFoodItem('Sojabönor')
  const sockerartor = await findOrCreateFoodItem('Sockerärtor')
  const rodlok = await findOrCreateFoodItem('Rödlök')
  const salladslok = await findOrCreateFoodItem('Salladslök')
  const paprika = await findOrCreateFoodItem('Paprika')
  const gurka = await findOrCreateFoodItem('Gurka')
  const morot = await findOrCreateFoodItem('Morot')
  const sweetchili = await findOrCreateFoodItem('Sweet Chili Sås')
  const limesaft = await findOrCreateFoodItem('Limesaft')
  const sotstro = await findOrCreateFoodItem('Sotstro')
  const sesamfron = await findOrCreateFoodItem('Rostade sesamfrön')
  const avokado = await findOrCreateFoodItem('Avokado')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Ellis pokébowl',
      description: 'Pokébowl med lax med rostade sesamfrön och sweet chili sås',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/LXFZgStz/2025-11-14-13-47-07-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 32,
      carbsPerServing: 60,
      fatPerServing: 14,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: salmalax.id,
            amount: 104,
            displayAmount: '104',
            displayUnit: 'g',
          },
          {
            foodItemId: ris.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: sojabonor.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: sockerartor.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
          },
          {
            foodItemId: rodlok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: salladslok.id,
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: paprika.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: gurka.id,
            amount: 40,
            displayAmount: '40',
            displayUnit: 'g',
          },
          {
            foodItemId: morot.id,
            amount: 20,
            displayAmount: '20',
            displayUnit: 'g',
          },
          {
            foodItemId: sweetchili.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
            notes: 'Slender Chef Sweet Chili'
          },
          {
            foodItemId: limesaft.id,
            amount: 15, // 1 msk ≈ 15ml
            displayAmount: '1',
            displayUnit: 'msk',
            notes: 'Pressad'
          },
          {
            foodItemId: sotstro.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sesamfron.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
            notes: 'strö över hela rätten'
          },
          {
            foodItemId: avokado.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
            notes: 'ta fettkälla från mellanmål'
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Börja med att sätta riset på kokning',
          },
          {
            stepNumber: 2,
            instruction: 'Under tiden riset kokar skär du upp grönsaker',
          },
          {
            stepNumber: 3,
            instruction: 'Sojabönor har jag frysta och värmer bara i lite uppkokat vatten',
          },
          {
            stepNumber: 4,
            instruction: 'Nu är det dags att blanda ihop såsen. Blanda alla ingredienser samman och riv ner ingefära och vitlöksklyftan. Tänk på att även riva limeskal över för mer smak',
          },
          {
            stepNumber: 5,
            instruction: 'Lägg upp fint och aptitligt på tallriken. Riset i botten och toppad med laxen. Droppa gärna lite extra limesaft över laxen',
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
