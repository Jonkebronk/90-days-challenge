import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥪 Lägger till recept: Bröd med ägg, kalkonpålägg och avokado...')

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
        title: 'Bröd med ägg, kalkonpålägg och avokado',
        description: 'Mättande frukostmacka med kokt ägg, kalkonpålägg och färsk avokado på rågbröd.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/tJSzwcF4/2025-11-20-16-21-49-Recipe-Keeper.png',
        prepTimeMinutes: 10,
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
      { name: 'Ägg, hela', amount: '1', unit: 'st', grams: 55 },
      { name: 'Kalkonpålägg', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Rågbröd', amount: '112', unit: 'gram (g)', grams: 112 },
      { name: 'Avokado, färsk', amount: '140', unit: 'gram (g)', grams: 140 },
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
      'Koka upp vatten i en kastrull (se till att du har tillräckligt med vatten för att täcka äggen). Koka äggen på medelhög värme i 5-6 minuter för mjukkokta, eller i 8-9 minuter för hårdkokta. Skölj äggen i kallt vatten och skala dem.',
      'Rosta eventuellt brödet. Dela avokadon på hälften och ta ut kärnan. Gröp ur halvorna med en sked och skär i mindre bitar.',
      'Tillsätt kalkonpålägget, äggen och avokadon till brödet. Smaklig måltid!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 8 : null, // Steg 1 tar 5-9 minuter (använder 8 som genomsnitt)
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Bröd med ägg, kalkonpålägg och avokado" har skapats!')
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
