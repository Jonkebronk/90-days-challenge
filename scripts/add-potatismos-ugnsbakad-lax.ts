import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Potatismos med ugnsbakad lax...')

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
        title: 'Potatismos med ugnsbakad lax',
        description: 'Klassisk husmanskost med krämigt potatismos med dill, kryddad ugnsbakad lax och grönsaker. Tips: Skala inte potatisen för extra näring och tuggmotstånd!',
        categoryId: laxCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/MK82C0F9/2025-11-21-00-36-04-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        caloriesPerServing: 509,
        proteinPerServing: 32,
        fatPerServing: 13,
        carbsPerServing: 58,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax', amount: '104', unit: 'gram (g)', grams: 104 },
      { name: 'Potatis', amount: '318', unit: 'gram (g)', grams: 318 },
      { name: 'Grönsaker', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Dill', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Vitlökspulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Cayennepeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Citron', amount: '0.5', unit: 'st', grams: 25 },
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
      'Koka potatisen med lite dill.',
      'Sätt på ugnen, grad beroende på om laxen är tinad eller fryst.',
      'Krydda laxen med förslagsvis peppar, vitlökspulver, cayannepeppar och citron.',
      'När potatisen är klar (koka hellre längre än för kort) så sparar du lite av kokvattnet, mosar och vispar med elvisp. Addera gärna mer dill och andra valfria kryddor.',
      'Gör iordning valfria grönsaker.',
      'Smaklig måltid!',
      'Tips! Jag skalar ej potatisen, finns bra näring i skalet och det blir lite tuggmotstånd, utöver att det är gott:)',
      'Grönsaker såsom gröna bönor eller broccoli är min favorit.',
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

    console.log('\n🎉 Recept "Potatismos med ugnsbakad lax" har skapats!')
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
