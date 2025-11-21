import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍝 Lägger till recept: Bönpasta med köttfärsås...')

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
        title: 'Bönpasta med köttfärsås',
        description: 'Proteinrik köttfärsås med mager nötfärs, krossade tomater och oregano. Serveras med bönpasta för en extra portion protein och fiber.',
        categoryId: notkottCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/xdQXqb8k/2025-11-21-00-40-32-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        caloriesPerServing: 510,
        proteinPerServing: 45,
        fatPerServing: 8,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nötfärs', amount: '152', unit: 'gram (g)', grams: 152 },
      { name: 'Bönpasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Lök, gul', amount: '41', unit: 'gram (g)', grams: 41 },
      { name: 'Tomater, krossade', amount: '159', unit: 'gram (g)', grams: 159 },
      { name: 'Vitlök', amount: '5', unit: 'gram (g)', grams: 5 },
      { name: 'Stevia ketchup', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Oregano', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Kokosolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Börja med att sätta på en kastrull med vatten till pastan ev ha en gnutta salt i.',
      'Hacka sedan löken och pressa eller finhacka vitlöken. Fräs löken i kokosolja tills den blir glansig i en gryta.',
      'Nu lägg i nötfärsen i grytan krydda med peppar och ev lite salt (detta är frivilligt).',
      'När färsen fått färg häller du i de krossade tomaterna och oregano, det går även att ha färska örter i som basilika eller rosmarin. Jag brukar ha i lite stevia ketchup för att få lite sötma.',
      'Låt nu såsen koka under lock i ca 15 min. Smaka sedan av och se om den behöver mer kryddor.',
      'När pasta vattnet kokar lägg i pastan och låt den koka i några minuter tills pastan har blivit mjuk, själv föredrar jag när det är al dente, alltså lite tuggmotstånd.',
      'När pastan är klar häll den i ett durkslag. Smaka nu på köttfärssåsen och se om den behöver mer kryddor.',
      'Lägg upp på en tallrik tillsammans med pastan och avnjut. Önskar man ha en sallad till går det är ta mindre av krossade tomaterna till såsen. Smaklig spis.',
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

    console.log('\n🎉 Recept "Bönpasta med köttfärsås" har skapats!')
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
