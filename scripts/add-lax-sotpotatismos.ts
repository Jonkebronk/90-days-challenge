import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Lax med sötpotatismos...')

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
        title: 'Lax med sötpotatismos',
        description: 'Näringrik och färgstark middag med stekt lax, krämigt sötpotatismos och färska sugar snaps. Serveras med blandad sallad.',
        categoryId: laxCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/y6jkxdCN/2025-11-21-00-32-56-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        caloriesPerServing: 509,
        proteinPerServing: 31,
        fatPerServing: 13,
        carbsPerServing: 65,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax', amount: '104', unit: 'gram (g)', grams: 104 },
      { name: 'Sötpotatis', amount: '292', unit: 'gram (g)', grams: 292 },
      { name: 'Sugar snaps', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Örtsalt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Skala sötpotatisen, skär den i mindre bitar och koka den med örtsalt.',
      'Örtsalta och peppra laxen och stek den.',
      'Koka upp en kastrull med vatten. Lägg i sugar snapsen och koka i 30 sekunder.',
      'Vispa ihop sötpotatisen till ett mos. Späd med kokvattnet till önskad konsistens.',
      'Servera med blandad sallad.',
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

    console.log('\n🎉 Recept "Lax med sötpotatismos" har skapats!')
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
