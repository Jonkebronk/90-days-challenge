/**
 * Script to classify existing Frukt products into subcategories
 * based on product names using keyword matching.
 *
 * Usage: npx tsx scripts/classify-frukt-subcategories.ts
 */

import { PrismaClient } from '@prisma/client'
import { classifyProductSubcategory, FRUKT_SUBCATEGORIES } from '../lib/products/subcategories'

const prisma = new PrismaClient()

async function classifyFruktProducts() {
  console.log('🍎 Starting Frukt subcategory classification...\n')

  // Get all Frukt products that don't have a subcategory yet
  const fruktProducts = await prisma.product.findMany({
    where: {
      category: { equals: 'Frukt', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      subCategory: true
    }
  })

  console.log(`Found ${fruktProducts.length} Frukt products\n`)

  // Statistics
  const stats: Record<string, number> = {}
  FRUKT_SUBCATEGORIES.forEach(sub => {
    stats[sub.key] = 0
  })
  stats['unclassified'] = 0

  let updated = 0
  let skipped = 0

  for (const product of fruktProducts) {
    // Skip if already has a subcategory
    if (product.subCategory) {
      skipped++
      continue
    }

    const subCategory = classifyProductSubcategory(product.name, 'frukt')

    if (subCategory) {
      await prisma.product.update({
        where: { id: product.id },
        data: { subCategory }
      })
      stats[subCategory]++
      updated++
      console.log(`✅ "${product.name}" → ${subCategory}`)
    } else {
      stats['unclassified']++
      console.log(`❓ "${product.name}" → (unclassified)`)
    }
  }

  console.log('\n📊 Classification Summary:')
  console.log('─'.repeat(40))

  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => {
      const label = FRUKT_SUBCATEGORIES.find(s => s.key === key)?.label || key
      console.log(`  ${label.padEnd(20)} ${count}`)
    })

  console.log('─'.repeat(40))
  console.log(`  Total updated: ${updated}`)
  console.log(`  Skipped (already classified): ${skipped}`)
  console.log('\n✨ Done!')
}

classifyFruktProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
