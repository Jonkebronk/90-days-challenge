import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥩 Lägger till recept: Nötkött och ris...')

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
        title: 'Nötkött och ris',
        description: 'Enkel och snabb vardagsmiddag med stekt köttfärs, ärtor och majs. Serveras med basmatiris eller jasminris.',
        categoryId: notkottCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/fLK21XtV/2025-11-21-00-45-52-Recipe-Keeper.png',
        prepTimeMinutes: 10,
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
      { name: 'Nötfärs 3-7% fett', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Ris, basmati/jasmin/långkornigt', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Ärtor', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Majs', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Olivolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Koka riset enligt anvisningarna på förpackningen i en kastrull med lättsaltat vatten.',
      'Häll av vätskan från majsen.',
      'Stek köttfärs, ärtor och majs i en stekpanna med olja på medelhög värme tills köttet har fått färg överallt.',
      'Krydda med salt, peppar och eventuella andra örter eller kryddor som du väljer.',
      'Servera köttfärsen, tillsammans med riset.',
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

    console.log('\n🎉 Recept "Nötkött och ris" har skapats!')
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
