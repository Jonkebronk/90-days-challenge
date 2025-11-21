import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥩 Lägger till recept: Pannbiff med potatis och ärtor...')

  try {
    // 1. Hitta Nötkött-kategorin
    const notkottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'notkott' }
    })

    if (!notkottCategory) {
      throw new Error('Nötkött-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', notkottCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Pannbiff med potatis och ärtor',
        description: 'Klassisk pannbiff av mager nötfärs, stekt gyllene i smör. Serveras med ugnsbakad potatis och kokta gröna ärtor.',
        categoryId: notkottCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/bYVLbqQQ/2025-11-21-00-46-33-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nötfärs, 3-7% fett, rå', amount: '155', unit: 'gram (g)', grams: 155 },
      { name: 'Smör, saltat', amount: '3.5', unit: 'tesked (tsk)', grams: 17 },
      { name: 'Gröna ärtor, frysta', amount: '0.25', unit: 'kopp', grams: 33 },
      { name: 'Potatis', amount: '2', unit: 'bit', grams: 246 },
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
      'Sätt ugnen på 200°C (vanlig ugn) eller 180°C (varmluft). Skala eller skrubba potatisen och skär dem i mindre bitar. Fördela potatisen på en ugnsplåt med bakplåtspapper och krydda med salt, peppar och eventuellt andra valfria kryddor och örter. Baka dem sedan i ugnen i cirka 30 minuter eller tills de är gyllene och mjuka.',
      'Forma köttfärsen till biffar och krydda med salt, peppar och eventuellt andra valfria kryddor eller örter. Värm upp en stekpanna med smöret på medelhög värme och stek biffarna tills de är gyllene på båda sidor.',
      'Koka upp en kastrull med lättsaltat vatten. Tillsätt ärtorna och koka i cirka 2 minuter. Häll sedan av vattnet.',
      'Servera pannbiffarna tillsammans med potatis och ärtor. Smaklig måltid!',
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

    console.log('\n🎉 Recept "Pannbiff med potatis och ärtor" har skapats!')
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
