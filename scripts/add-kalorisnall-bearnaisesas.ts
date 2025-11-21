import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍋 Lägger till recept: Kalorisnål Bearnaisesås...')

  try {
    // 1. Hitta Såser-kategorin
    const saserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'saser' }
    })

    if (!saserCategory) {
      throw new Error('Såser-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', saserCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Kalorisnål Bearnaisesås',
        description: 'Lättare variant av klassisk bearnaisesås med lätt crème fraiche, dragon och vitlök. Perfekt till grillat kött, fisk, kyckling eller grönsaker.',
        categoryId: saserCategory.id,
        servings: 3,
        coverImage: 'https://i.postimg.cc/G2xkWmZB/2025-11-20-17-13-20-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        caloriesPerServing: 48,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Crème fraiche, lätt', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Vitlök', amount: '1', unit: 'klyfta', grams: 5 },
      { name: 'Dragon, färsk, hackad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Vitvinsvinäger', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Skala och finhacka eller pressa vitlöksklyftan.',
      'Finhacka den färska dragonen.',
      'Blanda ner lätt crème fraiche, finhackad vitlök, hackad dragon och vitvinsvinäger. Rör om tills alla ingredienser är väl blandade.',
      'Smaka av bearnaisesåsen med salt och peppar efter smak, om så önskas. Rör om igen.',
      'Förvara den bearnaisesåsen i en lufttät behållare i kylskåpet i upp till 3-4 dagar.',
      'Servera den bearnaisesåsen som en smakrik sås till grillat kött, fisk, kyckling, grönsaker.',
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

    console.log('\n🎉 Recept "Kalorisnål Bearnaisesås" har skapats!')
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
