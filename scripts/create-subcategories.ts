import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📁 Skapar subkategorier...\n')

  try {
    // Hitta huvudkategorier
    const frukostCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'frukost' } })
    const lunchCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'lunch' } })
    const mellanmalCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'mellanmal' } })

    if (!frukostCategory || !lunchCategory || !mellanmalCategory) {
      throw new Error('Huvudkategorier saknas!')
    }

    // === FRUKOST SUBKATEGORIER ===
    console.log('🍳 Skapar Frukost-subkategorier...')

    const frukostSubcategories = [
      { name: 'Pannkakor & Plättar', slug: 'pannkakor-plattar', orderIndex: 1, categoryId: frukostCategory.id },
      { name: 'Gröt & Overnight Oats', slug: 'grot-overnight-oats', orderIndex: 2, categoryId: frukostCategory.id },
      { name: 'Bröd & Frallor', slug: 'brod-frallor', orderIndex: 3, categoryId: frukostCategory.id },
      { name: 'Muffins & Kakor', slug: 'muffins-kakor', orderIndex: 4, categoryId: frukostCategory.id },
      { name: 'Smoothies & Bowls', slug: 'smoothies-bowls', orderIndex: 5, categoryId: frukostCategory.id },
      { name: 'Våfflor', slug: 'vafflor', orderIndex: 6, categoryId: frukostCategory.id },
      { name: 'Keso & Kvarg', slug: 'keso-kvarg', orderIndex: 7, categoryId: frukostCategory.id },
      { name: 'Ägg & Smörgåsar', slug: 'agg-smorgarsar', orderIndex: 8, categoryId: frukostCategory.id },
    ]

    for (const subcat of frukostSubcategories) {
      const existing = await prisma.recipeSubcategory.findFirst({
        where: { slug: subcat.slug }
      })

      if (!existing) {
        await prisma.recipeSubcategory.create({ data: subcat })
        console.log(`   ✓ ${subcat.name}`)
      } else {
        console.log(`   ⚠️  ${subcat.name} finns redan`)
      }
    }

    // === LUNCH & MIDDAG SUBKATEGORIER ===
    console.log('\n🍽️  Skapar Lunch & Middag-subkategorier...')

    const lunchSubcategories = [
      { name: 'Kyckling', slug: 'kyckling', orderIndex: 1, categoryId: lunchCategory.id },
      { name: 'Fisk', slug: 'fisk', orderIndex: 2, categoryId: lunchCategory.id },
      { name: 'Skaldjur', slug: 'skaldjur', orderIndex: 3, categoryId: lunchCategory.id },
      { name: 'Nötkött', slug: 'notkott', orderIndex: 4, categoryId: lunchCategory.id },
      { name: 'Fläsk', slug: 'flask', orderIndex: 5, categoryId: lunchCategory.id },
      { name: 'Asiatiskt', slug: 'asiatiskt', orderIndex: 6, categoryId: lunchCategory.id },
      { name: 'Grytor & Soppor', slug: 'grytor-soppor', orderIndex: 7, categoryId: lunchCategory.id },
    ]

    for (const subcat of lunchSubcategories) {
      const existing = await prisma.recipeSubcategory.findFirst({
        where: { slug: subcat.slug }
      })

      if (!existing) {
        await prisma.recipeSubcategory.create({ data: subcat })
        console.log(`   ✓ ${subcat.name}`)
      } else {
        console.log(`   ⚠️  ${subcat.name} finns redan`)
      }
    }

    // === MELLANMÅL SUBKATEGORIER ===
    console.log('\n🍪 Skapar Mellanmål-subkategorier...')

    const mellanmalSubcategories = [
      { name: 'Proteindessert', slug: 'proteindessert', orderIndex: 1, categoryId: mellanmalCategory.id },
      { name: 'Röror & Frutti', slug: 'roror-frutti', orderIndex: 2, categoryId: mellanmalCategory.id },
      { name: 'Övrigt', slug: 'ovrigt', orderIndex: 3, categoryId: mellanmalCategory.id },
    ]

    for (const subcat of mellanmalSubcategories) {
      const existing = await prisma.recipeSubcategory.findFirst({
        where: { slug: subcat.slug }
      })

      if (!existing) {
        await prisma.recipeSubcategory.create({ data: subcat })
        console.log(`   ✓ ${subcat.name}`)
      } else {
        console.log(`   ⚠️  ${subcat.name} finns redan`)
      }
    }

    console.log('\n🎉 Alla subkategorier skapade!')

    // Visa sammanfattning
    const allSubcategories = await prisma.recipeSubcategory.findMany({
      include: {
        category: true
      },
      orderBy: [
        { categoryId: 'asc' },
        { orderIndex: 'asc' }
      ]
    })

    console.log('\n📊 Sammanfattning:')
    let currentCategory = ''
    allSubcategories.forEach(subcat => {
      if (subcat.category.name !== currentCategory) {
        console.log(`\n${subcat.category.name}:`)
        currentCategory = subcat.category.name
      }
      console.log(`   ${subcat.orderIndex}. ${subcat.name}`)
    })

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
