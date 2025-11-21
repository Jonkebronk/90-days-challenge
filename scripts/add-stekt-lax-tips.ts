import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Stekt lax...')

  try {
    // 1. Hitta Tips-kategorin
    const tipsCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'tips' }
    })

    if (!tipsCategory) {
      throw new Error('Tips-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', tipsCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Stekt lax',
        description: 'Guide för att steka perfekt lax. Stek gyllenbrun på alla sidor och sikta på innertemperatur 52-55 grader för bästa resultat.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/GtBc2c1j/2025-11-21-01-04-01-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 5,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lax odlad Norge fjordlax rå', amount: '300', unit: 'gram (g)', grams: 300 },
      { name: 'Joderat salt', amount: '0.2', unit: 'tesked (tsk)', grams: 1 },
      { name: 'Rapsolja, olivolja eller smör', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'TIPS: Att steka lax går snabbt så börja gärna med att tillaga tillbehören.',
      'Skär laxen i portionsbitar (förslagsvis ca 150 g) om det inte redan är gjort. Salta och krydda. Se tips på kryddning nedan.',
      'Hetta upp en stekpanna på medelvärme och lägg i rapsolja, olivolja eller smör (ej mjölkfritt). Fettet ska inte ätas, men ger yta och smak',
      'Stek laxen gyllenbrun på alla fyra sidor. Det tar ca 5 minuter totalt. Stekt lax ska gå att dela i flagor men blir snabbt torr om du steker för länge. För perfekt resultat kan du gärna använda en stektermometer och sikta på en innertemperatur på ca 52-55 grader.',
      'Ta upp laxen ur stekpannan och låt vila några minuter innan serveringen.',
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

    console.log('\n🎉 Tips "Stekt lax" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)

  } catch (error) {
    console.error('❌ Fel vid skapande av tips:', error)
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
