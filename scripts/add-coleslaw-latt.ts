import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥗 Lägger till recept: Coleslaw, lätt...')

  try {
    // 1. Hitta Såser-kategorin
    const saserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'saser' }
    })

    if (!saserCategory) {
      throw new Error('Såser-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', saserCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Coleslaw, lätt',
        description: 'Fräsch och lätt coleslaw med vitkål, morot, turkisk yoghurt, senap och honung.',
        categoryId: saserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/pr333kNd/2025-11-20-17-06-35-Recipe-Keeper.png',
        prepTimeMinutes: 35,
        cookTimeMinutes: 0,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Vitkål', amount: '250', unit: 'gram (g)', grams: 250 },
      { name: 'Morot medelstor', amount: '1', unit: 'st', grams: 100 },
      { name: 'Joderat salt', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Turkisk yoghurt fett 10%', amount: '1.5', unit: 'deciliter (dl)', grams: 150 },
      { name: 'Senap fransk', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Flytande honung', amount: '1', unit: 'tesked (tsk)', grams: 7 },
      { name: 'Svartpeppar', amount: '0.2', unit: 'tesked (tsk)', grams: 0.5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' fett')[0].split(' medelstor')[0].trim(), mode: 'insensitive' } }
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
      'Grovriv eller finstrimla vitkålen och riv moroten grovt. Blanda med saltet och låt stå ca 30 min. Pressa sedan ur den mesta vätskan.',
      'Blanda turkisk yoghurt, fransk senap, flytande honung och svartpeppar i en skål. Tillsätt grönsakskrivet och smaka eventuellt av med mer salt och peppar.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 30 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Coleslaw, lätt" har skapats!')
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
