import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍝 Lägger till recept: Krämig kalkonpasta med blomkål...')

  try {
    // 1. Hitta Kalkon-kategorin
    const kalkonCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kalkon' }
    })

    if (!kalkonCategory) {
      throw new Error('Kalkon-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kalkonCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Krämig kalkonpasta med blomkål',
        description: 'Proteinrik pasta med kalkonbacon och krämig blomkålssås. Servera med färsk chili på toppen.',
        categoryId: kalkonCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/t4J9KvV0/2025-11-20-16-53-01-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kalkonbacon', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Bönpasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Blomkål', amount: '160', unit: 'gram (g)', grams: 160 },
      { name: 'Lök/vitlök', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Sambal olek', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Färsk chili (topping)', amount: '5', unit: 'gram (g)', grams: 5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('/')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Koka upp vatten till pastan.',
      'Koka upp vatten till blomkål.',
      'Stek kalkonbacon och på slutet släng ner lök och vitlök.',
      'Koka blomkålen 3min för att få den lite aldente.',
      'Häll av vattnet och lägg ner blomkålen i en mixer tillsammans med 1/2dl pastavatten. I med svartpeppar. Mixa den helt slät. Fyll på mer vatten om den känns för stabbig.',
      'Häll i den nästan färdigkokade pastan i stekpannan tillsammans med kalkonen. Slå över den mixade blomkålen.',
      'Krydda med svartpeppar och i med sambal olek. Häll på 2 matskedar av pastavatten.',
      'Servera med färsk chili på toppen.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 3 ? 3 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Krämig kalkonpasta med blomkål" har skapats!')
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
