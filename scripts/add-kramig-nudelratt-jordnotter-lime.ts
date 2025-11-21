import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥜 Lägger till recept: God, krämig nudelrätt med smak av jordnötter, lime och ingefära...')

  try {
    // 1. Hitta Kyckling-kategorin
    const kycklingCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kyckling' }
    })

    if (!kycklingCategory) {
      throw new Error('Kyckling-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kycklingCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'God, krämig nudelrätt med smak av jordnötter, lime och ingefära',
        description: 'Asiatiskt inspirerad kycklingrätt med risnudlar, jordnötssmör, färsk lime och ingefära. En krämig och smakrik nudelrätt!',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/QxgKpb71/2025-11-21-00-20-26-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingfilé', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Risnudlar', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Paprika', amount: '125', unit: 'gram (g)', grams: 125 },
      { name: 'Lök', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Jordnötssmör, crunchy', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Lime, färskpressad', amount: '1', unit: 'st', grams: 50 },
      { name: 'Curry', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Ingefära, färsk', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Vitlök', amount: '2', unit: 'klyftor', grams: 10 },
      { name: 'Chili', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Kokosolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Vatten', amount: '0.5', unit: 'deciliter (dl)', grams: 50 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].trim(), mode: 'insensitive' } }
      })

      if (!foodItem) {
        // Skapa en enkel foodItem om den inte finns
        foodItem = await prisma.foodItem.create({
          data: {
            name: ing.name,
            calories: 0, // Placeholder
            proteinG: 0,
            fatG: 0,
            carbsG: 0,
          }
        })
        console.log(`  → Skapade foodItem: ${foodItem.name}`)
      }

      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          foodItemId: foodItem.id,
          amount: ing.grams,
          displayAmount: ing.amount,
          displayUnit: ing.unit,
        }
      })
    }

    console.log('✓ Lagt till', ingredients.length, 'ingredienser')

    // 4. Lägg till instruktioner
    const instructions = [
      'Hacka kycklingen och grönsakerna i bitar.',
      'Krydda kycklingen med curry, chili, ingefära, vitlök och lite Herbamare.',
      'Stek kycklingen i lite kokosolja. Ställ åt sidan.',
      'Stek löken och paprikan.',
      'Koka risnudlarna.',
      'Blanda ihop kycklingen och grönsakerna.',
      'På med färsk ingefära, en massa färskpressad lime. Stek ihop.',
      'Klicka i jordnötssmör med kycklingen och grönsakerna (fettkälla från mellanmål) och häll i lite vatten, så det blir krämigt.',
      'Släng i nudlarna och lite extra färskpressad lime.',
      'Enjoy!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "God, krämig nudelrätt med smak av jordnötter, lime och ingefära" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)

  } catch (error) {
    console.error('❌ Fel vid skapande av recept:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
