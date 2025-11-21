import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Ugnsstekt potatis...')

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
        title: 'Ugnsstekt potatis',
        description: 'Guide för att göra perfekt ugnsstekt potatis med knaprig yta. Koka först, sedan steka i ugn för bästa resultat.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/XYv07jcX/2025-11-21-01-07-40-Recipe-Keeper.png',
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
      { name: 'Potatis rå liten', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Smör fett 80%', amount: '0.5', unit: 'matsked (msk)', grams: 7 },
      { name: 'Rapsolja', amount: '0.5', unit: 'matsked (msk)', grams: 7 },
      { name: 'Grillkrydda', amount: '0.5', unit: 'tesked (tsk)', grams: 2 },
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
      'TIPS: Man kan ugnssteka potatis utan att koka den först, men om man gör så här får den en härligt knaprig yta.',
      'Skala potatisen. Välj helst små mjölig potatis av mindre modell eller dela dem i halvor.',
      'Koka i ca 8-10 minuter. Hetta upp ugnen till 225 grader.',
      'Häll dem i ett durkslag och skaka runt så att de får en "lufsig" yta.',
      'Lägg smör och rapsolja i den tomma grytan och låt smöret smälta. Häll i potatisen och blanda runt.',
      'Häll över potatisen i en ugnsfast form, gärna en glasform och krydda med valfria kryddor, exempelvis grillkrydda.',
      'Ställ in mitt i ugnen och låt steka/baka i ca 30-40 minuter eller tills potatisarna fått gyllene färg och knaprig yta.',
      'TIPS: Det går bra att förbereda denna rätt till och med steg 5 och sen bara ugnssteka potatisen vid serveringen.',
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

    console.log('\n🎉 Tips "Ugnsstekt potatis" har skapats!')
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
