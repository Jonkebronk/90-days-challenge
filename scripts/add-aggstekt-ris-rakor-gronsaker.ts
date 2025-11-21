import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🦐 Lägger till recept: Äggstekt ris med räkor och grönsaker...')

  try {
    // 1. Hitta Räkor-kategorin
    const rakorCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'rakor' }
    })

    if (!rakorCategory) {
      throw new Error('Räkor-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', rakorCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Äggstekt ris med räkor och grönsaker',
        description: 'Klassisk äggstekt ris med djuphavsräkor, morötter och gröna ärtor. Snabb och enkel vardagsmat.',
        categoryId: rakorCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/HnSpWVKS/2025-11-21-00-52-07-Recipe-Keeper.png',
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
      { name: 'Morötter', amount: '1', unit: 'bit', grams: 60 },
      { name: 'Ägg, hela', amount: '1', unit: 'bit', grams: 55 },
      { name: 'Gröna ärtor, frysta', amount: '0.5', unit: 'kopp', grams: 67 },
      { name: 'Olivolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Djuphavsräkor, rå, skalad och tinad', amount: '65', unit: 'gram (g)', grams: 65 },
      { name: 'Parboiled ris, okokt', amount: '0.5', unit: 'kopp', grams: 90 },
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
      'Koka riset i en kastrull med kokande lättsaltat vatten enligt anvisningen på förpackningen.',
      'Se till att räkorna är torra innan du steker dem i olja i en upphettad stekpanna. Stek inte räkorna för länge för då blir de sega.',
      'Tillsätt det kokta riset, stek i 1 min och flytta blandningen till sidan av pannan.',
      'Häll äggen i den tomma sidan av pannan och gör äggröra.',
      'Skölj grönsakerna och tärna moroten.',
      'Tillsätt grönsakerna och lite salt och rör om i 2 min på hög värme.',
      'Servera när alla ingredienser är varma.',
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

    console.log('\n🎉 Recept "Äggstekt ris med räkor och grönsaker" har skapats!')
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
