import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥣 Lägger till recept: Kvarg med frön, nötter och frukt...')

  try {
    // 1. Hitta Frukost-kategorin
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      throw new Error('Frukost-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', frukostCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Kvarg med frön, nötter och frukt',
        description: 'Nyttig och mättande frukost med kvarg, mandelsmör, banan, gojibär, granatäppelkärnor, mandlar och linfrön.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/9M8VMG9s/2025-11-20-16-40-05-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Mandelsmör, 100% mandlar', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Banan', amount: '1', unit: 'bit', grams: 110 },
      { name: 'Linfrön', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Torkade gojibär', amount: '2', unit: 'matsked (msk)', grams: 10 },
      { name: 'Granatäppelkärnor', amount: '0.5', unit: 'kopp', grams: 73 },
      { name: 'Kvarg, naturell, 0.2% fett', amount: '85', unit: 'gram (g)', grams: 85 },
      { name: 'Hela mandlar, naturella', amount: '0.5', unit: 'kopp', grams: 71 },
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
      'Skala och skiva bananen.',
      'Blanda kvarg med mandelsmör i en skål.',
      'Toppa kvargen med bananskivor, gojibär, granatäpplekärnor, mandlar och linfrön.',
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

    console.log('\n🎉 Recept "Kvarg med frön, nötter och frukt" har skapats!')
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
