import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥣 Lägger till recept: Gröt, bär, ägg...')

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
        title: 'Gröt, bär, ägg',
        description: 'Klassisk havregrynsgröt med färska bär och kokta ägg. Kan lagas i mikrovågsugn eller gryta.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/yYrBBXKV/2025-11-20-16-28-35-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser (med rimliga defaults)
    const ingredients = [
      { name: 'Havregryn', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Vatten', amount: '250', unit: 'milliliter (ml)', grams: 250 },
      { name: 'Ägg, mellanstora, kokta', amount: '2', unit: 'st', grams: 110 },
      { name: 'Bär (blåbär, hallon, jordgubbar)', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Kanel (valfritt)', amount: '1', unit: 'tesked (tsk)', grams: 0 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('(')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Blanda havregryn med vatten. Tillaga i mikrovågsugn på hög effekt i cirka 2 minuter alternativt blanda havregryn, vatten och salt i en gryta och koka upp.',
      'Tillsätt bär, salt och ev. Kanel till gröten och rör om ordentligt så att du får bort eventuella klumpar.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 2 : null, // Steg 1 tar 2 minuter (mikro) eller längre (gryta)
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Gröt, bär, ägg" har skapats!')
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
