import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍊 Lägger till recept: Havregrynsgröt med apelsin och keso...')

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
        title: 'Havregrynsgröt med apelsin och keso',
        description: 'Proteinrik havregrynsgröt med veganskt proteinpulver, toppad med färsk apelsin, laktosfri keso och mandelsmör.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/wBgwGZrV/2025-11-20-16-31-38-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 3,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Apelsin', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Veganskt proteinpulver', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Mandelsmör, 100% mandlar', amount: '22', unit: 'gram (g)', grams: 22 },
      { name: 'Mini keso, 1,5%, laktosfri', amount: '105', unit: 'gram (g)', grams: 105 },
      { name: 'Havregryn', amount: '66', unit: 'gram (g)', grams: 66 },
      { name: 'Vatten', amount: '200', unit: 'milliliter (ml)', grams: 200 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0], mode: 'insensitive' } }
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
      'Blanda havregryn, vatten och en nypa salt i en kastrull. Koka upp gröten och låt puttra på låg värme under omrörning i cirka 3 minuter. Tillsätt eventuellt lite vatten för en slätare gröt.',
      'Ta bort gröten från värmen och rör ner proteinpulvret. Blanda ordentligt för att undvika eventuella klumpar.',
      'Skala och skär apelsinen i mindre bitar.',
      'Servera gröten i en skål och toppa med apelsinen, keson och mandelsmöret. Smaklig måltid!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 3 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Havregrynsgröt med apelsin och keso" har skapats!')
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
