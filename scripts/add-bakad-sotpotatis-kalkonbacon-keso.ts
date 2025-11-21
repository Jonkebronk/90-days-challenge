import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥔 Lägger till recept: Bakad sötpotatis med kalkonbacon och keso...')

  try {
    // 1. Hitta eller skapa Kalkon-kategorin
    let kalkonCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kalkon' }
    })

    if (!kalkonCategory) {
      kalkonCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Kalkon',
          slug: 'kalkon',
          description: 'Rätter med kalkon som huvudingrediens'
        }
      })
      console.log('✓ Skapade kategori:', kalkonCategory.name)
    } else {
      console.log('✓ Hittade kategori:', kalkonCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Bakad sötpotatis med kalkonbacon och keso',
        description: 'Proteinrik och mättande rätt med bakad sötpotatis, stekt kalkonbacon, champinjoner, grönsaker och keso.',
        categoryId: kalkonCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/nrqXQRGg/2025-11-20-16-50-32-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
        caloriesPerServing: 511,
        proteinPerServing: 51,
        fatPerServing: 3,
        carbsPerServing: 67,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kalkonbacon', amount: '134', unit: 'gram (g)', grams: 134 },
      { name: 'Keso mini, laktosfri', amount: '67', unit: 'gram (g)', grams: 67 },
      { name: 'Sötpotatis', amount: '292', unit: 'gram (g)', grams: 292 },
      { name: 'Champinjoner', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Cocktailtomater', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Röd paprika', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Röd lök', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Salladsärter', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Rapsolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Sätt ugnen på 225 grader. Skölj av och dela sötpotatisen i halvor.',
      'Lägg sötpotatishalvorna på en bakplåtsklad form och pensla lite lätt med rapsolja. Baka potatisen i ugnen ca.25 min tills den är mjuk.',
      'Stek kalkonbacon och champinjoner.',
      'Ta ut sötpotatisen ur ugnen och lägg halvorna på en tallrik. Toppa med kalkonbacon och champinjoner.',
      'Lägg på önskad mängd av grönsaker och några klickar med keso.',
      'Smaka av med svartpeppar.',
      'Smaklig måltid!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 1 ? 25 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Bakad sötpotatis med kalkonbacon och keso" har skapats!')
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
