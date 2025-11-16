import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'Risnudlar': { calories: 364, protein: 3.4, carbs: 84, fat: 0.6 },
  'Broccolistam': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'Broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'Spetkål': { calories: 25, protein: 2, carbs: 6, fat: 0.2 },
  'Salladslök': { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2 },
  'Paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'Blomkål': { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Kokosolja': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'Vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Chili': { calories: 40, protein: 1.9, carbs: 9, fat: 0.4 },
  'Färsk koriander': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5 },
  'Gul Curry': { calories: 325, protein: 14, carbs: 58, fat: 14 },
  'Sambal oelek': { calories: 35, protein: 1.5, carbs: 7, fat: 0.5 },
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
  console.log('🥘 Creating Asiatisk Kycklingwok med Hetta recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const kyckling = await findOrCreateFoodItem('Kyckling')
  const risnudlar = await findOrCreateFoodItem('Risnudlar')
  const broccolistam = await findOrCreateFoodItem('Broccolistam')
  const broccoli = await findOrCreateFoodItem('Broccoli')
  const spetkol = await findOrCreateFoodItem('Spetkål')
  const salladslok = await findOrCreateFoodItem('Salladslök')
  const paprika = await findOrCreateFoodItem('Paprika')
  const blomkal = await findOrCreateFoodItem('Blomkål')
  const vatten = await findOrCreateFoodItem('Vatten')
  const kokosolja = await findOrCreateFoodItem('Kokosolja')
  const vitlok = await findOrCreateFoodItem('Vitlök')
  const chili = await findOrCreateFoodItem('Chili')
  const koriander = await findOrCreateFoodItem('Färsk koriander')
  const gulcurry = await findOrCreateFoodItem('Gul Curry')
  const sambaloelek = await findOrCreateFoodItem('Sambal oelek')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Asiatisk Kycklingwok med Hetta',
      description: 'Kycklingwok med Risnudlar',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/nL5c7v68/2025-11-14-14-26-46-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 511,
      proteinPerServing: 55,
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
          },
          {
            foodItemId: risnudlar.id,
            amount: 70,
            displayAmount: '70',
            displayUnit: 'g',
          },
          {
            foodItemId: broccolistam.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: broccoli.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: spetkol.id,
            amount: 38,
            displayAmount: '38',
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
            amount: 25,
            displayAmount: '25',
            displayUnit: 'g',
          },
          {
            foodItemId: blomkal.id,
            amount: 38,
            displayAmount: '38',
            displayUnit: 'g',
          },
          {
            foodItemId: vatten.id,
            amount: 100, // 1 dl
            displayAmount: '1',
            displayUnit: 'dl',
          },
          {
            foodItemId: kokosolja.id,
            amount: 4,
            displayAmount: '4',
            displayUnit: 'g',
            notes: '1 tsk = 4g (Ta från frukost eller mellanmål)'
          },
          {
            foodItemId: vitlok.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: chili.id,
            amount: 10,
            displayAmount: '10',
            displayUnit: 'g',
          },
          {
            foodItemId: koriander.id,
            amount: 3,
            displayAmount: '3',
            displayUnit: 'g',
          },
          {
            foodItemId: gulcurry.id,
            amount: 1,
            displayAmount: '1',
            displayUnit: 'krm',
          },
          {
            foodItemId: sambaloelek.id,
            amount: 2,
            displayAmount: '2',
            displayUnit: 'krm',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Lägg risnudlar i kallt vatten låt ligga i 20min',
          },
          {
            stepNumber: 2,
            instruction: 'Skär strimlor av paprikan, broccolistammen, spetkålen, salladslök(den gröna delen) ca 3x3 mm',
          },
          {
            stepNumber: 3,
            instruction: 'Strimla kycklingen. 5x5 mm',
          },
          {
            stepNumber: 4,
            instruction: 'Skiva salladslök (den vita delen)',
          },
          {
            stepNumber: 5,
            instruction: 'Skala och skiva vitlök',
          },
          {
            stepNumber: 6,
            instruction: 'Hacka koriandern',
          },
          {
            stepNumber: 7,
            instruction: 'Hacka Chilin',
          },
          {
            stepNumber: 8,
            instruction: 'Blanda koriander och chilin',
          },
          {
            stepNumber: 9,
            instruction: 'Marinera kycklingen i koriander blandningen',
          },
          {
            stepNumber: 10,
            instruction: 'Låt nudlarna minna av i ett durkslag',
          },
          {
            stepNumber: 11,
            instruction: 'Hetta upp en stekpanna med kokosoljan',
          },
          {
            stepNumber: 12,
            instruction: 'Bryn vitlöken',
          },
          {
            stepNumber: 13,
            instruction: 'Tillsätt sambal oelek',
          },
          {
            stepNumber: 14,
            instruction: 'Tillsätt kycklingen',
          },
          {
            stepNumber: 15,
            instruction: 'När den fått fin färg och nästan är klar tillsätt de strimlade grönsakerna och resten från broccolin samt blomkålen',
          },
          {
            stepNumber: 16,
            instruction: 'Tillsätt ca 1 dl vatten och låt står i 5min',
          },
          {
            stepNumber: 17,
            instruction: 'När vattnet är borta tillsätt nudlarna försiktigt',
          },
          {
            stepNumber: 18,
            instruction: 'Woka runt så allt blandas',
          },
          {
            stepNumber: 19,
            instruction: 'Avsluta med att toppa med den skivade salladslöken och chilin',
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
