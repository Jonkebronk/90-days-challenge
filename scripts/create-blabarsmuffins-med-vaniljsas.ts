import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Blåbär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg med blåbärssmak': { calories: 66, protein: 12, carbs: 3.6, fat: 0.2 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bakpulver': { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
  console.log('🫐 Creating Blåbärsmuffins med vaniljsås recipe...\n')

  // Find Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' }
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create or find all food items
  const blabar = await findOrCreateFoodItem('Blåbär')
  const kvarg = await findOrCreateFoodItem('Kvarg med blåbärssmak')
  const havregryn = await findOrCreateFoodItem('Havregryn')
  const bakpulver = await findOrCreateFoodItem('Bakpulver')
  const sotstro = await findOrCreateFoodItem('Sötströ')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Blåbärsmuffins med vaniljsås',
      description: 'Smarrig frukostmuffins med smak av blåbär',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/wjKZmpYj/2025-11-14-10-48-08-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 303,
      proteinPerServing: 24,
      carbsPerServing: 36,
      fatPerServing: 5,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: blabar.id,
            amount: 30,
            displayAmount: '30',
            displayUnit: 'g',
          },
          {
            foodItemId: kvarg.id,
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
            foodItemId: bakpulver.id,
            amount: 5, // 1 tsk ≈ 5g
            displayAmount: '1',
            displayUnit: 'tsk',
          },
          {
            foodItemId: sotstro.id,
            amount: 15, // 1 msk ≈ 15g
            displayAmount: '1',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Blanda samman alla ingredienser till en smet. Sötströ kan uteslutas. Behovs bara om man vill ha lite extra sötma. Blåbär kan man ta efter behag ca 0.5-1 dl. Man kan antingen ta hela färska, frysta eller så kan man micra dem till "sylt" innan man blandar dem i smeten.',
          },
          {
            stepNumber: 2,
            instruction: 'Fyll en stor muffinsform eller två små med smeten (jag har en form i teflon storlek större). Om du har teflonform smorj den innan med lite kokosolja',
          },
          {
            stepNumber: 3,
            instruction: 'Grädda i ugnen på 200 grader i 15-20 minuter. Ta omkring 15 minuter om du vill ha den lite kletig i mitten. Vill du hellre ha den lite fastare låter du den graddas i ca. 20 min',
          },
          {
            stepNumber: 4,
            instruction: 'Avnjut tillsammans med något passande tillbehör. Jag föredrar Barebells vaniljpudding för att få vaniljsåkänsla :)',
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
