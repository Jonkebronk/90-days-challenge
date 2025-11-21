import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥒 Lägger till recept: Grekisk Tzatziki...')

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
        title: 'Grekisk Tzatziki',
        description: 'Klassisk grekisk tzatziki med grekisk yoghurt, gurka, vitlök och färsk dill. Servera kall som tillbehör till grillat kött, sallader eller som dipp.',
        categoryId: saserCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/NMznrbj6/2025-11-20-17-07-21-Recipe-Keeper.png',
        prepTimeMinutes: 40,
        cookTimeMinutes: 0,
        caloriesPerServing: 42,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lärsas grekiska yoghurt', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Gurka, riven', amount: '0.5', unit: 'st', grams: 150 },
      { name: 'Vitlök', amount: '0.5', unit: 'klyfta', grams: 2.5 },
      { name: 'Dill färsk', amount: '1', unit: 'matsked (msk)', grams: 5 },
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
      'Börja med att skala och riva gurkan. Lägg den rivna gurkan i en sil eller i en ren kökshandduk och pressa ut så mycket vätska som möjligt. Detta är viktigt för att få en tjock och krämig tzatziki.',
      'Finhacka eller pressa vitlöksklyftan och hacka den färska dillen.',
      'Blanda ner lärsas grekiska yoghurt i en skål med den rivna gurkan samt den finhackade vitlöken och dillen. Rör om tills alla ingredienser är väl blandade.',
      'Smaka av med salt och peppar efter smak och rör om igen.',
      'För bästa smak, täck skålen med plastfolie och låt tzatzikin stå i kylskåpet i minst 30 minuter, gärna några timmar, så att smakerna hinner utvecklas och sätta sig.',
      'Servera tzatzikin kall som ett tillbehör till grillat kött, sallader, grönsaker eller som en dipp till råa grönsaker.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 4 ? 30 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Grekisk Tzatziki" har skapats!')
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
