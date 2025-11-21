import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Laxrätt med klyftpotatis...')

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
        title: 'Laxrätt med klyftpotatis',
        description: 'Klassisk laxrätt med kryddade klyftpotatis rostade i ugn, serverat med citronsås och en fräsch grönsallad.',
        categoryId: laxCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/tRvp8VHr/2025-11-21-00-33-32-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 40,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Potatis', amount: '600', unit: 'gram (g)', grams: 600 },
      { name: 'Olivolja', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Lökpulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Chilipeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Isbergssallad', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Gurka', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Tomat', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Paprika', amount: '100', unit: 'gram (g)', grams: 100 },
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
      'Skär laxen i portionsbitar och salta och peppra. Sätt ugnen på 225 grader.',
      'Skala eventuellt potatisen, skär i klyftor och blanda med olja, salt, lökpulver och chilipeppar. Lägg i en ugnsfast form med nonstickbeläggning eller på ett bakplåtspapper. Stek i mitten av ugnen i ca 40 min. Rör om ett par gånger under tiden.',
      'Tillaga laxen med klyftpotatis och citronsås.',
      'Gör en enkel sallad med exempelvis isbergssallad, gurka, tomat o paprika.',
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

    console.log('\n🎉 Recept "Laxrätt med klyftpotatis" har skapats!')
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
