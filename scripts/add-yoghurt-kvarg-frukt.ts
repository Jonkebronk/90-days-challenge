import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍎 Lägger till recept: Grekisk yoghurt/Kvarg med frukt...')

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
        title: 'Grekisk yoghurt/Kvarg med frukt',
        description: 'Flexibel och variationsrik frukost med yoghurt eller kvarg, frukt och nötter. Välj dina favorit-ingredienser!',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/SxvKTbRW/2025-11-20-16-26-53-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser (med defaults)
    const ingredients = [
      { name: 'Grekisk yoghurt 0% eller Kvarg 0,2%', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Äpple eller Banan', amount: '1', unit: 'st', grams: 120 },
      { name: 'Havregryn (valfritt)', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Naturella nötter', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Kanel (valfritt)', amount: '1', unit: 'tesked (tsk)', grams: 0 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('eller')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Välj din proteinkälla: Grekisk yoghurt 0% eller Kvarg 0,2%',
      'Välj din kolhydratkälla: Äpple, Banan eller Havregryn',
      'Toppa med naturella nötter och eventuellt lite kanel för extra smak',
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

    console.log('\n🎉 Recept "Grekisk yoghurt/Kvarg med frukt" har skapats!')
    console.log(`💡 Tips: Flexibelt recept som kan varieras efter smak!`)
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
