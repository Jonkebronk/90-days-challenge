import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🦐 Lägger till recept: Bönpasta med heta räkor...')

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
        title: 'Bönpasta med heta räkor',
        description: 'Proteinrik bönpasta med skalade räkor i kryddig tomatsås med vitlök, sambaloek och färsk basilika.',
        categoryId: rakorCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/4dD6LxwK/2025-11-21-00-49-33-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        caloriesPerServing: 510,
        proteinPerServing: 53,
        fatPerServing: 3,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Skalade räkor', amount: '225', unit: 'gram (g)', grams: 225 },
      { name: 'Bönpasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Krossade tomater', amount: '177', unit: 'gram (g)', grams: 177 },
      { name: 'Färsk basilika', amount: '23', unit: 'gram (g)', grams: 23 },
      { name: 'Sambaloek', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Pressad vitlök', amount: '1', unit: 'matsked (msk)', grams: 15 },
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
      'Börja med att puttra/småkoka de krossade tomaterna, pressa i vitlök, och ta i sambaloek (hacka även i eventuell gul lök för den som önskar)',
      'Koka upp vatten till pastan, och hacka under tiden basilika',
      'När pastan läggs ner i de kokande vattnet så häll i räkorna och basilikan i tomatsåsen',
      'När pastan kokat klart enligt paketets instruktioner så häll av allt vatten och slå sedan över tomatsåsen och räkorna över/på pastan',
      'Serveringstips: Avnjut med en iskall Cola Zero och om man önskar så har man några körsbärstomater och gurka bredvid',
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

    console.log('\n🎉 Recept "Bönpasta med heta räkor" har skapats!')
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
