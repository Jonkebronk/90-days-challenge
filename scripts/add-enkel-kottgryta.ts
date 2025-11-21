import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥘 Lägger till recept: Enkel Köttgryta...')

  try {
    // 1. Hitta Nötkött-kategorin
    const notkottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'notkott' }
    })

    if (!notkottCategory) {
      throw new Error('Nötkött-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', notkottCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Enkel Köttgryta',
        description: 'Klassisk och enkel köttgryta med mager nötkött, tomater, morötter och lök. Kryddad med lagerblad, peppar och timjan. Serveras med ris.',
        categoryId: notkottCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/4xQ961rK/2025-11-21-00-41-43-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 120,
        caloriesPerServing: 510,
        proteinPerServing: 45,
        fatPerServing: 8,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nötkött', amount: '152', unit: 'gram (g)', grams: 152 },
      { name: 'Ris', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Tomater', amount: '93', unit: 'gram (g)', grams: 93 },
      { name: 'Lök', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Morot', amount: '67', unit: 'gram (g)', grams: 67 },
      { name: 'Lagerblad', amount: '1', unit: 'st', grams: 1 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Timjan', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
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
      'Skär upp morot och lök, lägg det i en kastrull tillsammans med tomater och vatten.',
      'Bryn köttet med peppar, timjan och lite salt.',
      'När köttet är brynt, lägg ner det i kastrullen med grönsakerna, tillsätt en bit lagerblad i grytan, starta plattan så det kokar upp, sänk sedan till låg värme och låt det koka i ca 2 timmar. Rör någon gång ibland och tillsätt vatten när det behövs så det inte bränner vid botten.',
      'När grytan börjar bli klar, tillaga riset så det är klart samtidigt.',
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

    console.log('\n🎉 Recept "Enkel Köttgryta" har skapats!')
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
