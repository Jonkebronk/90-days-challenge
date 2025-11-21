import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥔 Lägger till recept: Tonfisk, sötpotatis och broccoli...')

  try {
    // 1. Hitta Lunch & Middag-kategorin
    const lunchCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lunch' }
    })

    if (!lunchCategory) {
      throw new Error('Lunch & Middag-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', lunchCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Tonfisk, sötpotatis och broccoli',
        description: 'Enkel och näringsrik rätt med ugnsbakad sötpotatis, konserverad tonfisk och ångkokt broccoli. Serveras med en fräsch citron- och dilldressing.',
        categoryId: lunchCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/HnCVfcMc/2025-11-21-01-19-28-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 40,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Olivolja', amount: '3', unit: 'tesked (tsk)', grams: 15 },
      { name: 'Sötpotatis', amount: '1.5', unit: 'bit (ca 300g)', grams: 300 },
      { name: 'Tonfisk, i vatten, konserverad', amount: '1', unit: 'burk (120g)', grams: 120 },
      { name: 'Broccoli', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Citronsaft', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Dill, hackad', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Sätt ugnen på 200°C (vanlig ugn) eller 180°C (varmluft). Skala eller skrubba sötpotatisen och tärna dem sedan. Blanda sötpotatisen med hälften av oljan, salt, peppar och eventuellt andra kryddor och örter efter eget tycke. Fördela sötpotatisen på en ugnsplåt med bakpapper och baka dem i cirka 30-40 minuter i ugnen. Tiden det tar beror på sötpotatisens storlek.',
      'Skölj broccolin och skär den i mindre buketter. Koka buketterna i en kastrull med kokande lättsaltat vatten i cirka 3 minuter.',
      'Häll av vätskan från tonfisken och blanda resten av oljan, citronsaft, salt, peppar och färsk dill till en dressing.',
      'Servera tonfisken tillsammans med sötpotatisen, broccolin och dressingen.',
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

    console.log('\n🎉 Recept "Tonfisk, sötpotatis och broccoli" har skapats!')
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
