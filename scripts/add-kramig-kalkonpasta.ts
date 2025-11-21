import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍝 Lägger till recept: Krämig kalkonpasta...')

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
        title: 'Krämig kalkonpasta',
        description: 'Proteinrik och krämig pasta med kalkonbacon och keso. Servera med blandade grönsaker för en komplett lunch.',
        categoryId: kalkonCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/SR4yHyWp/2025-11-20-16-52-31-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        caloriesPerServing: 441,
        proteinPerServing: 44,
        fatPerServing: 3,
        carbsPerServing: 57,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Keso cottage cheese mini 1,5%, laktosfri', amount: '82', unit: 'gram (g)', grams: 82 },
      { name: 'Kalkon bacon', amount: '123', unit: 'gram (g)', grams: 123 },
      { name: 'Barilla spagetthini', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Blandade grönsaker (tillbehör)', amount: '200', unit: 'gram (g)', grams: 200 },
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
      'Koka pastan efter instruktion.',
      'Stek kalkonbacon tills det får den färg som önskas.',
      'Häll i pastan i samma stekpanna som kalkonbaconet.',
      'Häll i keson och rör runt tills den smälter.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 10 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Krämig kalkonpasta" har skapats!')
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
