import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍋 Lägger till recept: Citron och Örtkryddad kyckling med spagetti...')

  try {
    // 1. Hitta Kyckling-kategorin
    const kycklingCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kyckling' }
    })

    if (!kycklingCategory) {
      throw new Error('Kyckling-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kycklingCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Citron och Örtkryddad kyckling med spagetti',
        description: 'Saftig kycklingfilé fylld med rosmarin, vitlök och citronskal, serverad med spagetti, spenat och stekt lök. En smakrik och hälsosam middag!',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/TY1S44k6/2025-11-21-00-16-41-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 25,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingfilé', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Spagetti', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Spenat, blad', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Lök, gul', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Citron, skal', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Rosmarin, färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Vitlök, hackad', amount: '2', unit: 'klyftor', grams: 10 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Örtsalt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Chili', amount: '1', unit: 'nypa', grams: 1 },
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
      'Sätt ugnen på 150 grader.',
      'Blanda ingredienserna till fyllningen: rosmarin, vitlök och rivet citronskal. Skär ett snitt i kycklingfilén och lägg i lite fyllning, bind ihop med tandpetare (eller om man lindar en skiva kalkonbacon runt men dra då AV vikt från kycklingfilén för att få med baconets vikt). Bryn snabbt i stekpannan. Ugnstek fileerna klara i ca 15 min el till innetemperatur är 70 grader.',
      'Koka under tiden pastan och stek lök i fettet och häll i blandspenaten när löken är klar och frås hastigt. Blanda sedan i spagettin i blandningen och servera med kycklingen.',
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

    console.log('\n🎉 Recept "Citron och Örtkryddad kyckling med spagetti" har skapats!')
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
