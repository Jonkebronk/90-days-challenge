import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥑 Lägger till recept: Guacamole...')

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
        title: 'Guacamole',
        description: 'Klassisk guacamole med avokado, lime, schalottenlök, vitlök, chilipeppar, tomat och färsk koriander.',
        categoryId: saserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/SNpBLTGd/2025-11-20-17-09-01-Recipe-Keeper.png',
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
      { name: 'Avokado, färsk', amount: '2', unit: 'st', grams: 300 },
      { name: 'Limejuice färskpressad', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Schalottenlök', amount: '1', unit: 'st', grams: 50 },
      { name: 'Vitlök', amount: '1', unit: 'klyfta', grams: 5 },
      { name: 'Chilipeppar färsk', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Tomat', amount: '0.5', unit: 'st', grams: 60 },
      { name: 'Joderat salt', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Koriander, färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
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
      'Mosa eller hacka fruktköttet från avokadorna och blanda med lime- eller citronsaft.',
      'Finhacka schalottenlök, chilipeppar, tomat och koriander. Riv vitlöksklyftan.',
      'Blanda allt och smaksätt med salt och eventuellt mer chili.',
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

    console.log('\n🎉 Recept "Guacamole" har skapats!')
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
