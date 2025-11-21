import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥩 Lägger till recept: Asiatisk nötfärs med risnudlar...')

  try {
    // 1. Hitta eller skapa Nötkött-kategorin
    let notkottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'notkott' }
    })

    if (!notkottCategory) {
      notkottCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Nötkött',
          slug: 'notkott',
        }
      })
      console.log('✓ Skapade kategori:', notkottCategory.name)
    } else {
      console.log('✓ Hittade kategori:', notkottCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Asiatisk nötfärs med risnudlar',
        description: 'Enkel och snabb asiatisk rätt med mager nötfärs, risnudlar och spenat. Perfekt för en vardagsmiddag!',
        categoryId: notkottCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/MpCy5TTM/2025-11-21-00-39-15-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nötfärs 3-7%', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Risnudlar, okokt', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Olivolja', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Spenat', amount: '200', unit: 'gram (g)', grams: 200 },
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
      'Koka nudlarna i en kastrull med lättsaltat vatten enligt anvisningen på förpackningen.',
      'Fräs nötfärsen med oljan i en stekpanna på medelhög värme tills gyllenbrun. Tillsätt spenaten och stek tills den tinat.',
      'Servera nudlarna tillsammans med nötfärsen.',
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

    console.log('\n🎉 Recept "Asiatisk nötfärs med risnudlar" har skapats!')
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
