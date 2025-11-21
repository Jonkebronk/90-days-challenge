import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Limebakad lax med tomatsalsa...')

  try {
    // 1. Hitta Lax-kategorin
    const laxCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lax' }
    })

    if (!laxCategory) {
      throw new Error('Lax-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', laxCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Limebakad lax med tomatsalsa',
        description: 'Ugnsb akad laxfilé med lime, serverad med fräsch tomatsalsa och ris. Gott med Larsas yoghurt och avokado som tillbehör.',
        categoryId: laxCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/G2p6jq91/2025-11-21-00-34-33-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: 510,
        proteinPerServing: 32,
        fatPerServing: 14,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax', amount: '104', unit: 'gram (g)', grams: 104 },
      { name: 'Ris', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Rödlök', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Tomater', amount: '150', unit: 'gram (g)', grams: 150 },
      { name: 'Sambal oelek', amount: '4', unit: 'gram (g)', grams: 4 },
      { name: 'Lime', amount: '1', unit: 'st', grams: 50 },
      { name: 'Svartpeppar', amount: '0.5', unit: 'krm', grams: 0.5 },
      { name: 'Olja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Sätt ugnen på 200g.',
      'Lägg laxfilén i en ugnsform och peppra.',
      'Finriv det yttersta skalet från limen och strö över laxen.',
      'Tillaga mitt i ugnen ca 20 minuter.',
      'Koka riset.',
      'Finhacka rödlöken och tärna tomaterna.',
      'Blanda lök, tomater, olja och sambal oelek. Smaka av salsan med svartpeppar.',
      'Servera limebakad lax med ris, salsa och limeklyftor.',
      'Gott med en klick Larsas yoghurt och avokado. (Låna från mellis). Limeklyftorna kan också användas för att lyxa till ditt vattenglas.',
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

    console.log('\n🎉 Recept "Limebakad lax med tomatsalsa" har skapats!')
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
