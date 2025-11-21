import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Nudlar...')

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
        title: 'Nudlar',
        description: 'Omfattande guide för att koka olika typer av nudlar perfekt - äggnudlar, glasnudlar, risnudlar, ramen nudlar och snabbnudlar. Lär dig tillagningsmetoder, koktider och serveringsförslag.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/T3x68jhF/2025-11-21-00-57-39-Recipe-Keeper.png',
        prepTimeMinutes: 5,
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
      { name: 'Nudlar (äggnudlar, glasnudlar, risnudlar eller ramen)', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Tillagning av perfekt kokta nudlar: För att tillaga perfekt kokta nudlar behöver du ha koll på olika sorters nudlar som äggnudlar, glasnudlar, risnudlar och ramen nudlar.',
      'Äggnudlar: Äggnudlar är en populär typ av nudlar som tillags med ägg i degen. För att tillaga perfekt kokta äggnudlar behöver du först koka upp vatten i en kastrull. När vattnet kokar, tillsätt nudlarna och låt dem koka enligt anvisningarna på förpackningen eller tills de är mjuka men fortfarande har lite tuggmotstånd.',
      'Glasnudlar: Glasnudlar är en typ av tunna och genomskinliga nudlar som tillverkas av mungbönsmjöl eller stärkelse från sötpotatis. För att tillaga glasnudlar, blötlägg dem först i varmt vatten i cirka 5-7 minuter tills de blir mjuka. Efter att du har blötlagt nudlarna kan du skära dem i mindre bitar om du föredrar det.',
      'Risnudlar: Risnudlar är en populär och mångsidig typ av nudlar som är tillverkade av ris. För att tillaga perfekt kokta risnudlar, börja med att koka upp en kastrull med vatten. När vattnet kokar, lägg i risnudlarna och låt dem koka enligt anvisningarna på förpackningen, vilket vanligtvis tar cirka 4-6 minuter.',
      'Ramen nudlar: Ramen nudlar är en populär typ av asiatiska nudlar som har sin egen unika smak och textur. För att tillaga perfekt kokta ramen nudlar, börja med att koka upp vatten i en stor kastrull. När vattnet kokar, lägg försiktigt i ramen nudlarna och koka enligt anvisningarna på förpackningen.',
      'Snabbnudlar: Snabbnudlar är en populär och bekväm maträtt som kan tillags på bara några minuter. För att få perfekt kokta snabbnudlar är det viktigt att följa rätt kokningstid och teknik. Först och främst, koka upp vatten i en kastrull och tillsätt sedan snabbnudlarna när vattnet kokar.',
      'Serveringsförslag och tillbehör: För att göra dina snabbnudlar ännu mer smakrika och mångisidiga, kan du experimentera med olika tillbehör och toppningar. Lägg till färska grönsaker som strimlad morot, hackad salladslök eller skivad paprika för att ge en färsk och krispig textur.',
      'Bästa tillbehören till snabbnudlar: När det kommer till snabbnudlar kan tillbehören verkligen göra skillnad. Här är några av de bästa tillbehören som du kan lägga till för att få dina snabbnudlar att smaka ännu bättre.',
      'Tips på topping till snabbnudlar: När det gäller att toppa snabbnudlar, finns det en mängd olika sätt att göra dem ännu läckrare och mer tillfredsställande. För det första kan du prova att lägga till lite grönsaker, till exempel skivade morötter, hackad kål eller strimlad paprika.',
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

    console.log('\n🎉 Tips "Nudlar" har skapats!')
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
