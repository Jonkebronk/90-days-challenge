import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💪 Lägger till recept: Proteingröt med bär...')

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
        title: 'Proteingröt med bär',
        description: 'Proteinrik och mättande gröt med havregryn, wheyprotein, nötsmör och färska bär. Tips: Använd olika bär eller olika smaker på proteinpulver!',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/5tQkvLDF/2025-11-20-16-43-52-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 2,
        caloriesPerServing: 494,
        proteinPerServing: 32,
        fatPerServing: 21,
        carbsPerServing: 43,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Bär (frysta eller färska)', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Nötsmör', amount: '32', unit: 'gram (g)', grams: 32 },
      { name: 'Wheyprotein', amount: '29', unit: 'gram (g)', grams: 29 },
      { name: 'Havregryn', amount: '48', unit: 'gram (g)', grams: 48 },
      { name: 'Vatten', amount: '96', unit: 'milliliter (ml)', grams: 96 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('(')[0].trim(), mode: 'insensitive' } }
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
      'Blanda havregryn med dubbla mängden vatten. Tillaga i mikrovågsugn ca 2 min på 800 effekt.',
      'Väg upp proteinet och blanda det med gröten, tillsätt vatten om önskas. (För konsistensen.)',
      'Tillsätt bär och nötsmör.',
      'Njut!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 2 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Proteingröt med bär" har skapats!')
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
