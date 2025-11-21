import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥄 Lägger till recept: Kall sås baserad på kvarg och yoghurt...')

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
        title: 'Kall sås baserad på kvarg och yoghurt',
        description: 'Mångsidig kall sås med kvarg, yoghurt, örter och vitlök. God som tillbehör till det mesta. Receptet inkluderar många smaksättningsförslag!',
        categoryId: saserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/4xyBpVjM/2025-11-20-17-11-46-Recipe-Keeper.png',
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
      { name: 'Yoghurt naturell lätt fett 0,5% berikad', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Kvarg mild naturell fett 0,2%', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Salt örtsalt', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Vitlök', amount: '0.5', unit: 'klyfta', grams: 2.5 },
      { name: 'Gräslök', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Mynta färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' fett')[0].trim(), mode: 'insensitive' } }
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
      'Hacka örterna, riv eller pressa vitlöken och blanda alla ingredienser plus lite nymalen svartpeppar. Låt gärna såsen stå och dra några timmar innan serveringen. Denna sås är god som tillbehör till det mesta. Här kommer fler förslag på smaksättningar.',
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

    console.log('✓ Lagt till', instructions.length, 'instruktion')

    console.log('\n🎉 Recept "Kall sås baserad på kvarg och yoghurt" har skapats!')
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
