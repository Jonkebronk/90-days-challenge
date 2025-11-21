import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥚 Lägger till recept: Keso med kokt ägg, tomat och banan...')

  try {
    // 1. Hitta Frukost-kategorin
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      throw new Error('Frukost-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', frukostCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Keso med kokt ägg, tomat och banan',
        description: 'Proteinrik och mättande frukost med laktosfri keso, kokt ägg, färsk tomat och banan.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/PJxcF9PF/2025-11-20-16-29-58-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 8,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Banan', amount: '275', unit: 'gram (g)', grams: 275 },
      { name: 'Keso, 4%, laktosfri', amount: '169', unit: 'gram (g)', grams: 169 },
      { name: 'Ägg, hela', amount: '1', unit: 'st', grams: 55 },
      { name: 'Tomat', amount: '120', unit: 'gram (g)', grams: 120 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0], mode: 'insensitive' } }
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
      'Koka upp vatten i en kastrull (se till att du har tillräckligt med vatten för att täcka äggen). Koka äggen på medelhög värme i 5-6 minuter för mjukkokta, eller i 8-9 minuter för hårdkokta. Skölj dem i kallt vatten och ta sedan bort skalet.',
      'Skölj och skär tomaten i mindre bitar',
      'Blanda ihop keson och tomaten i en skål. Krydda med salt, peppar och eventuellt andra valfria kryddor eller örter.',
      'Servera keson med ägget och bananen vid sidan om. Smaklig måltid!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 8 : null, // Steg 1 tar 5-9 minuter
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Keso med kokt ägg, tomat och banan" har skapats!')
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
