import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Pasta...')

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
        title: 'Pasta',
        description: 'Omfattande steg-för-steg guide för att koka perfekt pasta. Lär dig välja rätt kastrull och pastaform, koka med rätt mängd salt, smaka av för perfekt konsistens och blanda med såsen.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/T3x68jhF/2025-11-21-00-57-39-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 12,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Pasta', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Salt', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Olivolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Steg för steg-guide för att koka perfekt pasta: För att koka perfekt pasta behöver du välja rätt kastrull och pastaform, koka upp vatten och tillsätta salt, följa anvisningarna på förpackningen, smaka av för att säkerställa önskad konsistens och hälla av vattnet, men spara lite för att blanda med såsen.',
      'Välj rätt kastrull och pastaform: För att koka perfekt pasta krävs mer än början vid spisen. Ett kritiskt första steg är att välja rätt kastrull och pastaform. En idealisk kastrull ska vara tillräckligt stor för att ge pastan utrymme att röra sig fritt under kokningen.',
      'Koka upp vatten och tillsätt salt: För att koka perfekt pasta är det viktigt att starta med rätt grund. Börja med att koka upp rikligt med vatten i en kastrull av lämplig storlek. För att ge pastan den bästa smaken och konsistensen, glöm inte att tillsätta salt i vattnet innan det börjar koka.',
      'Koka pastan enligt anvisningarna på förpackningen: Det viktigaste steget för att koka perfekt pasta är att följa anvisningarna på förpackningen. Varje pastasort kan ha olika koktid och det är därför viktigt att läsa och följa instruktionerna noggrant.',
      'Smaka av för att säkerställa önskad konsistens: För att säkerställa att du får den perfekta konsistensen är det viktigt att smaka av den under kokningen. Genom att ta en liten bit pasta och tugga på den kan du avgöra om den är tillräckligt mjuk eller om den fortfarande behöver lite mer tid.',
      'Häll av vattnet, men spara lite för att blanda med såsen: Efter att pastan har kokats klart är det viktigt att hälla av vattnet, men kom ihåg att spara en liten mängd för att blanda med såsen. Detta hjälper till att binda samman pastan och såsen för att skapa en harmonisk smak och konsistens.',
      'Tips och tricks för att få pasta att bli ännu bättre: Blanda pastan med såsen och lite olivolja för att förbättra smaken och konsistensen, använd rätt sorts pasta för olika rätter, undvik överkokning för att behålla al dente-konsistensen, blanda pastan i en vid kastrull för enkel blandning med såsen, och låt pastan vila i såsen i några minuter innan servering för att absorbera smaker.',
      'Blanda pastan med såsen och lite olivolja: För att ge din pasta den bästa smaken och konsistensen är det viktigt att blanda den med såsen och lite olivolja. Genom att göra detta kan pastan absorbera smakerna från såsen och olivoljan, vilket ger varje tugga en härlig explosion av smak.',
      'Använd rätt sorts pasta för olika rätter: För att uppnå det bästa resultatet är det viktigt att använda rätt typ av pasta beroende på vilken rätt du tillagar. Varje sorts pasta har sin egen form och textur, vilket gör att den passar olika bra till olika såser och tillbehör.',
      'Undvik att överkoka pastan för att behålla al dente-konsistensen: För att få den perfekta konsistensen på din pasta är det viktigt att undvika att överkoka den. Att överkoka pastan kan göra den mjuk och klumpig istället för al dente, vilket innebär att den har en lätt tuggmotstånd och är perfekt genomkokt utan att vara för mjuk.',
      'Glöm inte att blanda pastan i en vid kastrull för att enkelt blanda med såsen: När du har kokat din pasta till perfektion är det viktigt att blanda den väl med såsen för att få en enhetlig och smakrik rätt. Ett bra knep för att underlätta blandningen är att använda en vid kastrull istället för tallriken.',
      'Låt pastan vila i såsen några minuter innan servering: Låt pastan vila i såsen några minuter innan servering för att den ska få möjlighet att absorbera smakerna ordentligt. Detta kommer att göra att pastan blir ännu mer smakrik och saftig.',
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

    console.log('\n🎉 Tips "Pasta" har skapats!')
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
