import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🦐 Lägger till recept: Ceviche (vit fisk/räkor)...')

  try {
    // 1. Hitta Räkor-kategorin
    const rakorCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'rakor' }
    })

    if (!rakorCategory) {
      throw new Error('Räkor-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', rakorCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Ceviche (vit fisk/räkor)',
        description: 'Fräsch ceviche med vit fisk eller räkor marinerad i lime och vitlök. Serveras med risnudlar, tomat, rödlök, gurka, avokado och kryddas med koriander och chili.',
        categoryId: rakorCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/wvXMzxgP/2025-11-21-00-51-09-Recipe-Keeper.png',
        prepTimeMinutes: 30,
        cookTimeMinutes: 10,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Vit fisk/räkor', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Risnudlar', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Tomat', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Rödlök', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Jordgubbar', amount: '10', unit: 'gram (g)', grams: 10 },
      { name: 'Lime', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Gurka', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Avokado', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Vitlöksklyfta', amount: '1', unit: 'st', grams: 5 },
      { name: 'Koriander', amount: '1', unit: 'msk', grams: 5 },
      { name: 'Kikomon gluten och sockerfri soja', amount: '1', unit: 'msk', grams: 15 },
      { name: 'Chili', amount: '1', unit: 'st', grams: 5 },
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
      'Pressa Lime och vitlök och lägg det i en skål',
      'Skär fisken i små 1 cm kuber. Lägg dem i lime marinaden. Marinera i minst 20 minuter',
      'Koka risnudlarna skölj sedan av dom',
      'Blanda fisken med grönsakerna. Krydda med koriander och finhackad chili',
      'Servera salladen med ris nudlar och eventuellt lite soja',
      'Bon Apetit!',
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

    console.log('\n🎉 Recept "Ceviche (vit fisk/räkor)" har skapats!')
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
