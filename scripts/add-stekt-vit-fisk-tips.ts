import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Stekt vit fisk...')

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
        title: 'Stekt vit fisk',
        description: 'Guide för att steka perfekt vit fisk som torsk. Lär dig rätt steketid och temperatur, samt hur du känner igen när fisken är färdigstekt.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/XqMVpR76/2025-11-21-01-06-13-Recipe-Keeper.png',
        prepTimeMinutes: 15,
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
      { name: 'Torsk rå', amount: '300', unit: 'gram (g)', grams: 300 },
      { name: 'Joderat salt', amount: '0.5', unit: 'tesked (tsk)', grams: 2 },
      { name: 'Vitpeppar, malen', amount: '0.1', unit: 'tesked (tsk)', grams: 0.5 },
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
      'Salta helst fiskbitarna minst en 10 min i förväg så blir smaken djupare och köttet fastare. Det går snabbt att steka fisk, så passa på att förbereda tillbehören medan du väntar.',
      'Hetta upp en stekpanna på medelvärme. Torka av fisken med ett hushållspapper så att den är helt torr. Krydda med peppar eller andra valfria kryddor.',
      'När stekpannan är riktigt het så tillsätter du rapsolja, olivolja eller smör (ej mjölkfritt) och lägger i fisken. Fettet ska inte ätas, men ger fin yta och god smak. Vänd inte fiskbitarna i onödan så får de finare färg och chansen ökar att de inte faller sönder.',
      'NÄR ÄR FISKEN FÄRDIGSTEKT? Fiskkottet ska vara vitt och ogenomskinligt när den är klar. Tunna fiskfiléer blir färdigstekta på ca 1-2 min per sida. Tjocka filéer och fiskkotletter behöver 3-5 min per sida men då bör man dra ner på värmen de sista minuterna.',
      'Det går också bra att låta tjocka fiskfiléer steka färdigt i 150 graders ugn. Använd gärna stektermometer och satsa då på en innertemperatur på ca 52 grader.',
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

    console.log('\n🎉 Tips "Stekt vit fisk" har skapats!')
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
