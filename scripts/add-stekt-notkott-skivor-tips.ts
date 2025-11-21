import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Stekt nötkött i skivor (biff, file)...')

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
        title: 'Stekt nötkött i skivor (biff, file)',
        description: 'Guide för att steka perfekt biff eller filé. Lär dig rätt temperatur, stekmetod och innertemperatur för rare, medium rare, medium eller well done.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/DfWJmh6N/2025-11-21-01-04-45-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nöt Ryggbiff rå', amount: '300', unit: 'gram (g)', grams: 300 },
      { name: 'Joderat salt', amount: '0.5', unit: 'tesked (tsk)', grams: 2 },
      { name: 'Svartpeppar', amount: '0.2', unit: 'tesked (tsk)', grams: 1 },
      { name: 'Rapsolja, olivolja eller klarnat smör', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Ta fram köttet i god tid och ta av plasten. Skär i skivor om det inte redan är gjort. För bästa stekresultat bör köttet vara rumstempererat och ytan helt torr. Medan du väntar kan du förbereda tillbehören.',
      'Hetta upp en stekpanna på medelvärme. Salta och peppra köttet.',
      'När stekpannan är ordentligt het så tillsätter du lite rapsolja, olivolja eller klarnat smör. Fettet ska inte ätas men ger fin yta och smak. Lägg sedan i köttet. Låt bli att vända och röra köttet i onödan. När köttet vätskar sig på den ostekta sidan brukar det vara dags att vända och sen steker du tills köttet är som du vill ha det.',
      'Låt köttet vila minst 5 minuter och servera sen med valfria tillbehör.',
      'TIPS: Tunna skivor kött, som lövbiff blir snabbt färdiga, men om de är lite tjockare kan du gärna använda en stektermometer för att avgöra när köttet är som du vill ha det. Rare (blodigt): ca 55 grader, Medium rare: 58-60 grader, Medium: 61-65 grader, Well done (genomstekt): 66-70 grader.',
      'Om du ska steka mer än 2-3 biffar blir resultat bättre om du steker i omgångar. Stekpannan ska aldrig vara mer än till två tredjedelar full. Då tappar pannan i värme och vätska från köttet tränger ut.',
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

    console.log('\n🎉 Tips "Stekt nötkött i skivor (biff, file)" har skapats!')
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
