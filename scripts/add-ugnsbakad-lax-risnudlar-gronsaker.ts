import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Ugnsbakad lax med risnudlar och grönsaker...')

  try {
    // 1. Hitta Lax-kategorin
    const laxCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lax' }
    })

    if (!laxCategory) {
      throw new Error('Lax-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', laxCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Ugnsbakad lax med risnudlar och grönsaker',
        description: 'Färgstark och hälsosam rätt med ugnsbakad lax, risnudlar och massor av färska grönsaker. Serveras med en kryddig yoghurtsås med sweet chili och sambal oelek.',
        categoryId: laxCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/0QpZDS0s/2025-11-21-00-37-53-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 15,
        caloriesPerServing: 509,
        proteinPerServing: 31,
        fatPerServing: 12,
        carbsPerServing: 66,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Mango', amount: '24', unit: 'gram (g)', grams: 24 },
      { name: 'Lax', amount: '81', unit: 'gram (g)', grams: 81 },
      { name: 'Grekiska yoghurt, Larsas', amount: '56', unit: 'gram (g)', grams: 56 },
      { name: 'Risnudlar', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Morötter', amount: '18', unit: 'gram (g)', grams: 18 },
      { name: 'Rödlök', amount: '24', unit: 'gram (g)', grams: 24 },
      { name: 'Paprika', amount: '12', unit: 'gram (g)', grams: 12 },
      { name: 'Körsbärstomater', amount: '37', unit: 'gram (g)', grams: 37 },
      { name: 'Babyspenat', amount: '10', unit: 'gram (g)', grams: 10 },
      { name: 'Gurka', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Slender Chef Sweet Chili', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Sambal Oelek', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Herbamare Original', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Sätt ugnen på 225 grader.',
      'Krydda laxen med valfria kryddor. Jag använde Herbamare Original och svartpeppar.',
      'Tillaga risnudlarna enligt anvisning på förpackningen.',
      'Baka laxen ca 15 min (tinad lax) i ugnen.',
      'Hacka grönsakerna.',
      'Blanda Larsas grekiska yoghurt med valfri mängd slender Chef Sweet Chili och Sambal Oelek.',
      'Servera med valfria grönsaker (jag hade rödlök, babyspenat, morötter, körsbärstomater, paprika, gurka och mango) och sås gjord Larsas grekiska yoghurt, Slender chef Sweet Chili och Sambal Oelek.',
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

    console.log('\n🎉 Recept "Ugnsbakad lax med risnudlar och grönsaker" har skapats!')
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
