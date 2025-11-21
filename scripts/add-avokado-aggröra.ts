import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥑 Lägger till recept: Avokado och äggröra på rostat bröd...')

  try {
    // 1. Hitta Frukost-kategorin
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      throw new Error('Frukost-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', frukostCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Avokado och äggröra på rostat bröd',
        description: 'Klassisk frukost med mosad avokado och krämig äggröra på rostat fullkornsbröd. Toppas med salladslök.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: null, // Läggs till senare
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Avokado, färsk', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Ägg, hela', amount: '1', unit: 'st', grams: 55 },
      { name: 'Salladslök', amount: '60', unit: 'gram (g)', grams: 60 },
      { name: 'Minimjölk, 0.1% fett', amount: '51.5', unit: 'milliliter (ml)', grams: 51 },
      { name: 'Fullkornsbröd', amount: '2.5', unit: 'skiva', grams: 112 },
      { name: 'Äggvita, pastöriserad', amount: '210', unit: 'gram (g)', grams: 210 },
      { name: 'Matlagningsspray', amount: '2', unit: 'sekund', grams: 0 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0], mode: 'insensitive' } }
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
      'Dela avokadon, ta ur kärnan och gröpa ur halvorna med en sked och mosa i en skål. Krydda med salt, peppar och andra valfria kryddor eller örter.',
      'Vispa ihop äggen med mjölk, salt och peppar och häll ned i en stekpanna med matlagningsspray på medelhög värme tills de är en fast men krämig röra.',
      'Rosta brödet. Skölj och skiva salladslöken. Toppa brödet med mosad avokado, äggröra och salladslök.',
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

    console.log('\n🎉 Recept "Avokado och äggröra på rostat bröd" har skapats!')
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
