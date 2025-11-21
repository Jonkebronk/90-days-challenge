import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Airfryer lax med broccoli och kokt potatis...')

  try {
    // 1. Hitta eller skapa Lax-kategorin
    let laxCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lax' }
    })

    if (!laxCategory) {
      laxCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Lax',
          slug: 'lax',
        }
      })
      console.log('✓ Skapade kategori:', laxCategory.name)
    } else {
      console.log('✓ Hittade kategori:', laxCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Airfryer lax med broccoli och kokt potatis',
        description: 'Hälsosam och enkel middag med laxfilé tillagad i airfryer, färsk broccoli och kokt potatis. Kryddad med vitlökspulver, paprikapulver och färska citronskivor.',
        categoryId: laxCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/yY7cptsv/2025-11-21-00-31-38-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax, filé', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Potatis', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Broccoli', amount: '300', unit: 'gram (g)', grams: 300 },
      { name: 'Paprikapulver', amount: '3.5', unit: 'tesked (tsk)', grams: 10 },
      { name: 'Vitlökspulver', amount: '3.5', unit: 'tesked (tsk)', grams: 10 },
      { name: 'Citronskivor, färska', amount: '5.5', unit: 'st', grams: 55 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
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
      'Sätt air fryern på 200°C och koka upp en kastrull med lättsaltat vatten.',
      'Skölj och skär potatisen och broccolin i mindre bitar.',
      'Tillsätt potatisen till kastrullen och låt koka i cirka 15 minuter tills den är mjuk. Du kan känna efter med en potatissticka eller gaffel om potatisen är klar.',
      'Krydda laxfileerna med vitlökspulver, paprikapulver, salt och peppar. Toppa varje laxbit med två citronskivor och krydda broccolin med salt och peppar.',
      'Tillaga laxen i airfryern i cirka 8-10 minuter tills den har fått en gyllene färg och är genomstekt men inte torr. Tillsätt broccolibitarna till airfryern efter halva tiden och tillaga tills de börjar bli mjuka och gyllene.',
      'Servera laxen och broccolin tillsammans med potatisen. Smaklig måltid!',
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

    console.log('\n🎉 Recept "Airfryer lax med broccoli och kokt potatis" har skapats!')
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
