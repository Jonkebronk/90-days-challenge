import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌶️ Lägger till recept: Paprikaröra...')

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
        title: 'Paprikaröra',
        description: 'Röd paprikaröra med vitlök, persilja och olivolja. Perfekt som sås till pasta, sallader, grillad kyckling, fisk eller grönsaker.',
        categoryId: saserCategory.id,
        servings: 3,
        coverImage: 'https://i.postimg.cc/D0ty5qB6/2025-11-20-17-16-12-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        caloriesPerServing: 46,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Paprika, röd', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Vitlök', amount: '1', unit: 'klyfta', grams: 5 },
      { name: 'Persilja, färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Olivolja', amount: '1', unit: 'matsked (msk)', grams: 15 },
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
      'Rosta paprika i ugnen i ca 200C.',
      'Skala och finhacka eller pressa vitlöksklyftan.',
      'Finhacka den färska persiljan.',
      'Lägg den rostade paprikan, finhackad vitlök och persilja i en matberedare eller mixer.',
      'Mixa ingredienserna samtidigt som du tillsätter olivolja i en tunn stråle. Fortsätt mixa tills du får en slät och krämig konsistens.',
      'Smaka av paprikaröran med salt och peppar efter smak, om så önskas. Mixa ytterligare några sekunder för att blanda väl.',
      'Förvara paprikaröran i en lufttät behållare i kylskåpet i upp till en vecka.',
      'Servera paprikaröran som en smakrik sås till pasta, sallader, grillad kyckling, fisk, grönsaker.',
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

    console.log('\n🎉 Recept "Paprikaröra" har skapats!')
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
