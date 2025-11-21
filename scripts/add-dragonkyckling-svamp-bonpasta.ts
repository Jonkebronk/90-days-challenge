import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌿 Lägger till recept: Dragonkyckling med svamp och bönpasta...')

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
        title: 'Dragonkyckling med svamp och bönpasta',
        description: 'Krämig dragonkryddad kyckling med svamp, babyspenat och proteinrik bönpasta med minikeso. Serveras med en fräsch sallad.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/wjhkf5d6/2025-11-21-00-18-08-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: 511,
        proteinPerServing: 52,
        fatPerServing: 4,
        carbsPerServing: 62,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingfilé', amount: '134', unit: 'gram (g)', grams: 134 },
      { name: 'Minikeso', amount: '67', unit: 'gram (g)', grams: 67 },
      { name: 'Bönpasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Champinjoner', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Babyspenat', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Dragon, torkad', amount: '1', unit: 'matsked (msk)', grams: 5 },
      { name: 'Vitlökspulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Vitpeppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Skär kycklingfiléerna i lagom stora bitar.',
      'Hacka all svamp samt även babyspenaen om du vill att det ska ta mindre plats i stekpannan.',
      'Stek upp kycklingen, när allt har fått lite färg och är genomstekt så tillsätt svampen.',
      'Krydda stekpanneblandningen efter smak. Snåla inte på dragonen!',
      'Koka upp pastavatten och häll i bönpastan.',
      'Sänk värmen på pannan och lägg i babyspenaen. När den har minskat i volym och blivit lite härligt sladdrig så ta bort stekpannan helt från värmen.',
      'Nu borde pastan vara färdigkokt, häll av och blanda i minikeso.',
      'När keson har smält ner lite kan vatten tillsättas tills önskad "såsighet" uppnås. Häll i allt från stekpannan ner i pastakastrullen! KLART!',
      'Serveras med en fräsch sallad vid sida.',
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

    console.log('\n🎉 Recept "Dragonkyckling med svamp och bönpasta" har skapats!')
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
