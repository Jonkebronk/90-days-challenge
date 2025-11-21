import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥄 Lägger till recept: Kvargdipp...')

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
        title: 'Kvargdipp',
        description: 'Enkel och fräsch kvargdipp med vitlök, gräslök och persilja. Perfekt som dipp till grönsaker eller som tillbehör till sallad.',
        categoryId: saserCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/0NqK9qGX/2025-11-20-17-15-17-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        caloriesPerServing: 42,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kvarg, naturell', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Rödlök, finhackad', amount: '0.5', unit: 'st', grams: 50 },
      { name: 'Vitlök', amount: '1', unit: 'klyfta', grams: 5 },
      { name: 'Gräslök, hackad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Persilja, färsk, hackad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
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
      'Börja med att finhacka eller pressa vitlöksklyftan, gräslöken och persiljan.',
      'Blanda ner allt i en skål, blanda naturell kvarg, vitlök, gräslök och persilja. Rör om tills alla ingredienser är väl blandade.',
      'Smaka av med salt och peppar efter smak och rör om igen.',
      'För bästa smak, täck skålen med plastfolie och låt dipp-såsen stå i kylskåpet i minst 30 minuter, gärna några timmar.',
      'Servera kvargdippen som dipp till grönsaker eller som en del av en sallad.',
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

    console.log('\n🎉 Recept "Kvargdipp" har skapats!')
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
