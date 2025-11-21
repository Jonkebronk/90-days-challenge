import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌮 Lägger till recept: Fajita kyckling...')

  try {
    // 1. Hitta Kyckling-kategorin
    const kycklingCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kyckling' }
    })

    if (!kycklingCategory) {
      throw new Error('Kyckling-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kycklingCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Fajita kyckling',
        description: 'Kryddig fajitakyckling med kalkonbacon, färsk broccoli och ris. Smaksatt med fajita kryddmix för en autentisk smak.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/jjMzyhGh/2025-11-21-00-19-25-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        caloriesPerServing: 510,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kyckling', amount: '145', unit: 'gram (g)', grams: 145 },
      { name: 'Kalkonbacon', amount: '36', unit: 'gram (g)', grams: 36 },
      { name: 'Ris', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Broccoli, färsk', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Fajita kryddmix', amount: '10', unit: 'gram (g)', grams: 10 },
      { name: 'Kokosolja', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Vatten', amount: '0.5', unit: 'deciliter (dl)', grams: 50 },
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
      'Hacka kalkonbaconet och stek knapert i en panna.',
      'Skär kycklingen och stek i kokosolja.',
      'Ta broccolin och stek i kokosolja.',
      'Sedan blandar du i allt i samma och på med kryddmixen och vatten.',
      'Koka ris.',
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

    console.log('\n🎉 Recept "Fajita kyckling" har skapats!')
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
