import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥛 Lägger till recept: Yoghurtsås baserad på grekisk yoghurt...')

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
        title: 'Yoghurtsås baserad på grekisk yoghurt (lågfett, högprotein)',
        description: 'Mångsidig yoghurtsås med grekisk yoghurt, vitlök och sambal oelek. Receptet innehåller 20 olika smakförslag - från klassisk tzatziki till exotiska varianter med mango chutney, pepparrot och tångkaviar. Perfekt som bas för många olika såser!',
        categoryId: saserCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/RZCVdVRz/2025-11-20-17-18-00-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Grekisk yoghurt fett 0,2% protein 11%', amount: '2', unit: 'deciliter (dl)', grams: 200 },
      { name: 'Vitlök', amount: '1', unit: 'klyfta', grams: 5 },
      { name: 'Sambal oelek', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Havssalt', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Svartpeppar', amount: '0.2', unit: 'tesked (tsk)', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' fett')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Riv eller pressa vitlöken och blanda alla ingredienser. Låt gärna såsen stå och dra några timmar innan serveringen.',
      'Denna sås är god som tillbehör till det mesta. Här kommer fler förslag på smaksättningar:',
      'NR 1: 1 msk gräslök, 1 msk mynta, 0,5 vitlöksklyfta (Passar till det mesta)',
      'NR 2: 1 vitlöksklyfta, 2 msk hackad persilja, 0,5 tsk honung (Passar till det mesta)',
      'NR 3: 10 cm riven gurka, salta lätt och låt rinna av i durkslag + 1-2 vitlöksklyftor (Passar till det mesta)',
      'NR 4: 0,5 dl ajvar relish (Passar till det mesta)',
      'NR 5: 0,5 dl hackade soltorkade tomater + några droppar balsamvinäger (Passar till det mesta, testa till kikärtsbiffar)',
      'NR 6: 0,5 dl hackade oliver + 1-2 msk hackad salladsslök (Gott till ost- eller grönsaksrätter)',
      'NR 7: Skal och saft av en halv citron + chili efter smak (Gott till fisk, skaldjur eller grönsaker)',
      'NR 8: 1 dl färska örter (Passar till det mesta)',
      'NR 9: 2 msk lökjrom, stenbitsrom eller tångkaviar + färsk dill och/eller gräslök (Gott till fisk och bakad potatis)',
      'NR 10: 2 msk chilisås, valfri hetta (Passar till det mesta)',
      'NR 11: 100 gram mosad fetaost, mager (Gott till varma och kalla grönsaker, passar bra i bakad potatis)',
      'NR 12: Ca 2 msk thai sweet chili (Gott till kycklingrätter eller ugnsrostade rotfrukter)',
      'NR 13: Ca 2 msk mango chutney (Gott till stekt lax, kyckling och många andra rätter)',
      'NR 14: 2 tsk fransk senap, 1 tsk honung och färska örter (Passar till det mesta)',
      'NR 15: 2 tsk söt senap + dill (Gott till inlagd sill och gravad lax)',
      'NR 16: 1-2 tsk pepparmix, stött svartpeppar, grönpeppar och roséeppar (Passar till det mesta)',
      'NR 17: ½ hackat äpple, ½ tsk curry och lite finhackad gul lök (Gott till fisk- och kycklingrätter)',
      'NR 18: ½ dl krossad ananas, avrunnen (Gott till bland annat kassler och andra kötträtter)',
      'NR 19: Riven pepparrot efter smak + 1 tsk honung + 1 msk limejuice (Gott till fiskrätter och rökt kött eller korv)',
      'NR 20: 0,5 dl finhackad mynta + 1 vitlöksklyfta (Passar till det mesta, gärna indisk mat)',
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

    console.log('\n🎉 Recept "Yoghurtsås baserad på grekisk yoghurt" har skapats!')
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
