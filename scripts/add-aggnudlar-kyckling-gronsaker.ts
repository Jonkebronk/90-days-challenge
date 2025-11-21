import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍜 Lägger till recept: Äggnudlar med kyckling och grönsaker...')

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
        title: 'Äggnudlar med kyckling och grönsaker',
        description: 'Asiatisk nudelrätt med kycklingbröst, äggnudlar, paprika och majs. Kryddad med hoisinsås för en autentisk smak.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/j20QjSpg/2025-11-21-00-30-35-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingbröstfilé, rå', amount: '130', unit: 'gram (g)', grams: 130 },
      { name: 'Äggnudlar', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Paprika, grön', amount: '77', unit: 'gram (g)', grams: 77 },
      { name: 'Olivolja', amount: '2.5', unit: 'tesked (tsk)', grams: 12 },
      { name: 'Paprika, röd', amount: '77', unit: 'gram (g)', grams: 77 },
      { name: 'Majs, konserverad', amount: '123', unit: 'gram (g)', grams: 123 },
      { name: 'Hoisinsås', amount: '1.5', unit: 'matsked (msk)', grams: 22 },
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
      'Koka nudlarna i en kastrull med kokande lättsaltat vatten enligt anvisningen på förpackningen.',
      'Stek kycklingen i en stekpanna på medelvärme tills den är gyllene och genomstekta men inte torr. Skiva sedan.',
      'Häll av vattnet från majsen och skölj paprikan. Skär bort paprikans kärnor och skiva.',
      'Stek grönsakerna i hoisinsås i 4-5 minuter på hög värme.',
      'Blanda alla ingredienser och servera maten.',
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

    console.log('\n🎉 Recept "Äggnudlar med kyckling och grönsaker" har skapats!')
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
