import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍋 Lägger till recept: Citron- och örtdressing...')

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
        title: 'Citron- och örtdressing',
        description: 'Fräsch dressing med turkisk yoghurt, citron, persilja och dill. Låt gärna stå och dra minst en timme innan servering.',
        categoryId: saserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/Dy9KNfFY/2025-11-20-17-05-34-Recipe-Keeper.png',
        prepTimeMinutes: 10,
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
      { name: 'Turkisk yoghurt fett 10%', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Yoghurt naturell lätt fett 0,5% berikad', amount: '0.5', unit: 'deciliter (dl)', grams: 50 },
      { name: 'Citronjuice färskpressad', amount: '2', unit: 'matsked (msk)', grams: 30 },
      { name: 'Citronskal', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Persilja blad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Dill färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Honung', amount: '1', unit: 'tesked (tsk)', grams: 7 },
      { name: 'Salt örtsalt', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Svartpeppar', amount: '0.2', unit: 'tesked (tsk)', grams: 0.5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' fett')[0].split(' färsk')[0].split(' blad')[0].trim(), mode: 'insensitive' } }
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
      'Tvätta citronen och riv det yttersta gula på skalet.',
      'Blanda samman alla ingredienser och smaka av. Låt gärna stå och dra minst en timme innan serveringen.',
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

    console.log('\n🎉 Recept "Citron- och örtdressing" har skapats!')
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
