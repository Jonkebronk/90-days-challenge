import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍝 Lägger till recept: Spagetti och köttfärssås med pizzasallad...')

  try {
    // 1. Hitta eller skapa Myhapp Kött-kategorin
    let kottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'myhapp-kott' }
    })

    if (!kottCategory) {
      kottCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Myhapp Kött',
          slug: 'myhapp-kott',
          description: 'Kötträtter från Myhapp'
        }
      })
      console.log('✓ Skapade kategori:', kottCategory.name)
    } else {
      console.log('✓ Hittade kategori:', kottCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Spagetti och köttfärssås med pizzasallad',
        description: 'Klassisk köttfärssås med fullkornspasta och fräsch pizzasallad. Receptet ger 4 portioner.',
        categoryId: kottCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/MH6CyX7f/2025-11-20-16-54-31-Recipe-Keeper.png',
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
      { name: 'Nötfärs (Max 10% fett)', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Fullkornspasta', amount: '250', unit: 'gram (g)', grams: 250 },
      { name: 'Gul lök', amount: '1', unit: 'st', grams: 150 },
      { name: 'Vitlök', amount: '2', unit: 'klyftor', grams: 10 },
      { name: 'Morot', amount: '2', unit: 'st', grams: 200 },
      { name: 'Rapsolja', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Tomatpuré', amount: '2', unit: 'matsked (msk)', grams: 30 },
      { name: 'Basilika, torkad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Lagerblad', amount: '2', unit: 'st', grams: 1 },
      { name: 'Krossade tomater', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Kinesisk soja', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Vitkål', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Ättikssprit', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Oregano, torkad', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Salt', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('(')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Skala och hacka lök och vitlök. Skala och tärna morot fint.',
      'Hetta upp en panna med en tredjedel av oljan och bryn färs och grönsaker.',
      'Blanda ner tomatpuré och kryddor (hälften av oreganon), låt fräsa med 1 min.',
      'Tillsätt krossade tomater och soja, låt det puttra utan lock ca 20 minuter.',
      'Koka fullkornsspagetti enligt anvisningar på förpackning.',
      'Skiva eller hyvla vitkålen tunt. Salta och krama ur kälen väl med händerna.',
      'Tillsätt ättika, vatten, resten av oljan och oregano samt svartpeppar. (Vitkålssalladen kan förberedas för att korta tillagningstiden - passa på att göra extra!)',
      'Servera nykokt pasta med köttfärssås och pizzasallad.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 3 ? 20 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Spagetti och köttfärssås med pizzasallad" har skapats!')
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
