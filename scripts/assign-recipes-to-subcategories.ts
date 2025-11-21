import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Tilldelar recept till subkategorier...\n')

  try {
    // Hitta alla subkategorier
    const subcategories = await prisma.recipeSubcategory.findMany({
      include: { category: true }
    })

    const getSubcategoryBySlug = (slug: string) =>
      subcategories.find(s => s.slug === slug)

    // === FRUKOST ===
    console.log('🍳 Tilldelar Frukost-recept...')

    const frukostRecipes = await prisma.recipe.findMany({
      where: { category: { slug: 'frukost' } },
      select: { id: true, title: true }
    })

    let frukostCount = { pannkakor: 0, grot: 0, brod: 0, muffins: 0, smoothies: 0, vafflor: 0, keso: 0, agg: 0 }

    for (const recipe of frukostRecipes) {
      const title = recipe.title.toLowerCase()
      let subcategoryId: string | null = null

      if (title.includes('pannkak') || title.includes('plätt') || title.includes('plättar')) {
        subcategoryId = getSubcategoryBySlug('pannkakor-plattar')?.id || null
        frukostCount.pannkakor++
      } else if (title.includes('gröt') || title.includes('overnight') || title.includes('oat')) {
        subcategoryId = getSubcategoryBySlug('grot-overnight-oats')?.id || null
        frukostCount.grot++
      } else if (title.includes('bröd') || title.includes('fralla') || title.includes('scone') || title.includes('knäckebröd')) {
        subcategoryId = getSubcategoryBySlug('brod-frallor')?.id || null
        frukostCount.brod++
      } else if (title.includes('muffin') || title.includes('kaka') || title.includes('paj') || title.includes('tårta')) {
        subcategoryId = getSubcategoryBySlug('muffins-kakor')?.id || null
        frukostCount.muffins++
      } else if (title.includes('smoothie') || title.includes('bowl')) {
        subcategoryId = getSubcategoryBySlug('smoothies-bowls')?.id || null
        frukostCount.smoothies++
      } else if (title.includes('våffl')) {
        subcategoryId = getSubcategoryBySlug('vafflor')?.id || null
        frukostCount.vafflor++
      } else if (title.includes('keso') || title.includes('kvarg') || title.includes('yoghurt') || title.includes('frutti') || title.includes('müsli')) {
        subcategoryId = getSubcategoryBySlug('keso-kvarg')?.id || null
        frukostCount.keso++
      } else if (title.includes('ägg') || title.includes('smörgås') || title.includes('avokado') || title.includes('räk')) {
        subcategoryId = getSubcategoryBySlug('agg-smorgarsar')?.id || null
        frukostCount.agg++
      }

      if (subcategoryId) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { subcategoryId }
        })
      }
    }

    console.log(`   ✓ Pannkakor & Plättar: ${frukostCount.pannkakor} recept`)
    console.log(`   ✓ Gröt & Overnight Oats: ${frukostCount.grot} recept`)
    console.log(`   ✓ Bröd & Frallor: ${frukostCount.brod} recept`)
    console.log(`   ✓ Muffins & Kakor: ${frukostCount.muffins} recept`)
    console.log(`   ✓ Smoothies & Bowls: ${frukostCount.smoothies} recept`)
    console.log(`   ✓ Våfflor: ${frukostCount.vafflor} recept`)
    console.log(`   ✓ Keso & Kvarg: ${frukostCount.keso} recept`)
    console.log(`   ✓ Ägg & Smörgåsar: ${frukostCount.agg} recept`)

    // === LUNCH & MIDDAG ===
    console.log('\n🍽️  Tilldelar Lunch & Middag-recept...')

    const lunchRecipes = await prisma.recipe.findMany({
      where: { category: { slug: 'lunch' } },
      select: { id: true, title: true }
    })

    let lunchCount = { kyckling: 0, fisk: 0, skaldjur: 0, notkott: 0, flask: 0, asiatiskt: 0, grytor: 0 }

    for (const recipe of lunchRecipes) {
      const title = recipe.title.toLowerCase()
      let subcategoryId: string | null = null

      // Prioritera proteinkälla
      if (title.includes('kyckling')) {
        subcategoryId = getSubcategoryBySlug('kyckling')?.id || null
        lunchCount.kyckling++
      } else if (title.includes('räk') || title.includes('ceviche')) {
        subcategoryId = getSubcategoryBySlug('skaldjur')?.id || null
        lunchCount.skaldjur++
      } else if (title.includes('lax') || title.includes('torsk') || title.includes('tonfisk') || title.includes('fisk')) {
        subcategoryId = getSubcategoryBySlug('fisk')?.id || null
        lunchCount.fisk++
      } else if (title.includes('nöt') || title.includes('köttfärs') || title.includes('biff') || title.includes('kött')) {
        subcategoryId = getSubcategoryBySlug('notkott')?.id || null
        lunchCount.notkott++
      } else if (title.includes('fläsk') || title.includes('bacon') || title.includes('kalkon')) {
        subcategoryId = getSubcategoryBySlug('flask')?.id || null
        lunchCount.flask++
      } else if (title.includes('asiatisk') || title.includes('wok') || title.includes('pokébowl') || title.includes('thai') || title.includes('teriyaki')) {
        subcategoryId = getSubcategoryBySlug('asiatiskt')?.id || null
        lunchCount.asiatiskt++
      } else if (title.includes('gryta') || title.includes('soppa') || title.includes('curry')) {
        subcategoryId = getSubcategoryBySlug('grytor-soppor')?.id || null
        lunchCount.grytor++
      }

      if (subcategoryId) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { subcategoryId }
        })
      }
    }

    console.log(`   ✓ Kyckling: ${lunchCount.kyckling} recept`)
    console.log(`   ✓ Fisk: ${lunchCount.fisk} recept`)
    console.log(`   ✓ Skaldjur: ${lunchCount.skaldjur} recept`)
    console.log(`   ✓ Nötkött: ${lunchCount.notkott} recept`)
    console.log(`   ✓ Fläsk: ${lunchCount.flask} recept`)
    console.log(`   ✓ Asiatiskt: ${lunchCount.asiatiskt} recept`)
    console.log(`   ✓ Grytor & Soppor: ${lunchCount.grytor} recept`)

    // === MELLANMÅL ===
    console.log('\n🍪 Tilldelar Mellanmål-recept...')

    const mellanmalRecipes = await prisma.recipe.findMany({
      where: { category: { slug: 'mellanmal' } },
      select: { id: true, title: true }
    })

    let mellanmalCount = { dessert: 0, roror: 0, ovrigt: 0 }

    for (const recipe of mellanmalRecipes) {
      const title = recipe.title.toLowerCase()
      let subcategoryId: string | null = null

      if (title.includes('kasein') || title.includes('protein') || title.includes('ostkaka') || title.includes('kladdkaka')) {
        subcategoryId = getSubcategoryBySlug('proteindessert')?.id || null
        mellanmalCount.dessert++
      } else if (title.includes('röra') || title.includes('frutti') || title.includes('kvarg')) {
        subcategoryId = getSubcategoryBySlug('roror-frutti')?.id || null
        mellanmalCount.roror++
      } else {
        subcategoryId = getSubcategoryBySlug('ovrigt')?.id || null
        mellanmalCount.ovrigt++
      }

      if (subcategoryId) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { subcategoryId }
        })
      }
    }

    console.log(`   ✓ Proteindessert: ${mellanmalCount.dessert} recept`)
    console.log(`   ✓ Röror & Frutti: ${mellanmalCount.roror} recept`)
    console.log(`   ✓ Övrigt: ${mellanmalCount.ovrigt} recept`)

    console.log('\n🎉 Alla recept tilldelade!')

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
